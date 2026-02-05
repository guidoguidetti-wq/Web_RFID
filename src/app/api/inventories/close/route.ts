import { NextRequest, NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';

export async function POST(req: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await req.json();
    const { inv_id, create_movements, update_items } = body;

    if (!inv_id) {
      return NextResponse.json({ error: 'ID Inventario mancante' }, { status: 400 });
    }

    await client.query('BEGIN');

    // 1. Fetch Inventory Details
    const invRes = await client.query(
      `SELECT inv_name, inv_note, inv_det_place, inv_det_zone, inv_mis_place, inv_mis_zone 
       FROM "inventories" WHERE inv_id = $1`,
      [inv_id]
    );

    if (invRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Inventario non trovato' }, { status: 404 });
    }

    const inv = invRes.rows[0];

    // Helper for inserting movements
    const insertMovements = async (conditionClause: string, destPlace: string, destZone: string) => {
        // We join Items to get the *previous* location for the note
        // Note: We use COALESCE to handle cases where item might not exist in Items table (though it should)
        const sql = `
          INSERT INTO "Movements" 
          (mov_epc, mov_dest_place, mov_dest_zone, mov_timestamp, mov_notes, mov_ref, mov_user)
          SELECT 
            ii.int_epc,
            $1, -- dest place
            $2, -- dest zone
            NOW(),
            $3 || ' From ' || COALESCE(i.place_last, 'N/A') || '/' || COALESCE(i.zone_last, 'N/A'),
            $4, -- ref (inv_name)
            'System' -- user (generic)
          FROM "inventory_items" ii
          LEFT JOIN "Items" i ON ii.int_epc = i.item_id
          WHERE ii.int_inv_id = $5 AND (${conditionClause})
        `;
        await client.query(sql, [destPlace, destZone, inv.inv_note || '', inv.inv_name, inv_id]);
    };

    // Helper for updating items
    const updateItemsTable = async (conditionClause: string, destPlace: string, destZone: string) => {
        const sql = `
          UPDATE "Items"
          SET 
            date_lastseen = NOW(),
            place_last = $1,
            zone_last = $2
          WHERE item_id IN (
            SELECT int_epc FROM "inventory_items" ii
            WHERE int_inv_id = $3 AND (${conditionClause})
          )
        `;
        await client.query(sql, [destPlace, destZone, inv_id]);
    };

    // --- FOUND ITEMS (Expected or Unexpected) ---
    // Dest: inv_det_place, inv_det_zone
    const foundCondition = "ii.inv_expected = true OR ii.inv_unexpected = true";
    
    if (create_movements) {
        await insertMovements(foundCondition, inv.inv_det_place, inv.inv_det_zone);
    }
    if (update_items) {
        await updateItemsTable(foundCondition, inv.inv_det_place, inv.inv_det_zone);
    }

    // --- LOST ITEMS ---
    // Dest: inv_mis_place, inv_mis_zone
    const lostCondition = "ii.inv_lost = true";

    if (create_movements) {
         await insertMovements(lostCondition, inv.inv_mis_place, inv.inv_mis_zone);
    }
    if (update_items) {
         await updateItemsTable(lostCondition, inv.inv_mis_place, inv.inv_mis_zone);
    }

    // 2. Close the Inventory
    await client.query(
        `UPDATE "inventories" SET inv_state = 'CLOSE' WHERE inv_id = $1`,
        [inv_id]
    );

    await client.query('COMMIT');
    return NextResponse.json({ success: true });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error closing inventory:', error);
    return NextResponse.json({ error: 'Errore durante la chiusura dell\'inventario' }, { status: 500 });
  } finally {
    client.release();
  }
}
