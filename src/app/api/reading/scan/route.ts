import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { username, epc, type, checklist_id } = await req.json();

    if (!username || !epc || !type) {
      return NextResponse.json({ error: 'username, epc e type richiesti' }, { status: 400 });
    }

    const t = Number(type);

    if (t === 4) {
      // Type 4 – No Checklist
      // Skip if already scanned (not lost)
      const existing = await query(
        'SELECT 1 FROM inventory_items_temp WHERE int_id = $1 AND int_epc = $2 AND inv_lost = false',
        [username, epc]
      );
      if (existing.rowCount && existing.rowCount > 0) {
        return NextResponse.json({ status: 'duplicate' });
      }

      // Check if EPC exists in Items table
      const itemRes = await query('SELECT 1 FROM "Items" WHERE item_id = $1', [epc]);
      const isKnown = (itemRes.rowCount ?? 0) > 0;

      await query(
        `INSERT INTO inventory_items_temp (int_id, int_epc, inv_expected, inv_unexpected, inv_lost)
         VALUES ($1, $2, $3, $4, false)`,
        [username, epc, isKnown, !isKnown]
      );
      return NextResponse.json({ status: isKnown ? 'expected' : 'unexpected' });

    } else if (t === 3) {
      // Type 3 – Checklist EPC
      // Check if EPC is already in temp for this user (was pre-loaded as lost or already scanned)
      const existing = await query(
        'SELECT int_epc, inv_lost FROM inventory_items_temp WHERE int_id = $1 AND int_epc = $2',
        [username, epc]
      );

      if (existing.rowCount && existing.rowCount > 0) {
        const row = existing.rows[0];
        if (!row.inv_lost) {
          // Already scanned and confirmed → duplicate
          return NextResponse.json({ status: 'duplicate' });
        }
        // Was pre-loaded as lost → now found → mark expected
        await query(
          `UPDATE inventory_items_temp
           SET inv_expected = true, inv_lost = false
           WHERE int_id = $1 AND int_epc = $2`,
          [username, epc]
        );
        return NextResponse.json({ status: 'expected' });
      } else {
        // Not in checklist → unexpected
        await query(
          `INSERT INTO inventory_items_temp (int_id, int_epc, inv_expected, inv_unexpected, inv_lost)
           VALUES ($1, $2, false, true, false)`,
          [username, epc]
        );
        return NextResponse.json({ status: 'unexpected' });
      }

    } else if (t === 2) {
      // Type 2 – Checklist SKU
      // Skip if already scanned (not lost)
      const alreadyScanned = await query(
        'SELECT 1 FROM inventory_items_temp WHERE int_id = $1 AND int_epc = $2 AND inv_lost = false',
        [username, epc]
      );
      if (alreadyScanned.rowCount && alreadyScanned.rowCount > 0) {
        return NextResponse.json({ status: 'duplicate' });
      }

      // Get product for this EPC
      const itemRes = await query(
        'SELECT item_product_id FROM "Items" WHERE item_id = $1',
        [epc]
      );

      if (!itemRes.rowCount || itemRes.rowCount === 0) {
        // EPC not in Items at all → unexpected
        await query(
          `INSERT INTO inventory_items_temp (int_id, int_epc, inv_expected, inv_unexpected, inv_lost)
           VALUES ($1, $2, false, true, false)`,
          [username, epc]
        );
        return NextResponse.json({ status: 'unexpected' });
      }

      const productId = itemRes.rows[0].item_product_id;

      // Check if product is in checklist
      const inChecklist = await query(
        'SELECT 1 FROM checklist_products WHERE ckp_chl_id = $1 AND ckp_product_id = $2',
        [checklist_id, productId]
      );

      if (inChecklist.rowCount && inChecklist.rowCount > 0) {
        // Product in checklist → find a lost row for this product and mark expected
        const lostRow = await query(
          `SELECT t.int_epc FROM inventory_items_temp t
           JOIN "Items" i ON i.item_id = t.int_epc
           WHERE t.int_id = $1 AND t.inv_lost = true AND i.item_product_id = $2
           LIMIT 1`,
          [username, productId]
        );

        if (lostRow.rowCount && lostRow.rowCount > 0) {
          // Mark the pre-loaded lost item as expected (could be same EPC or different)
          const lostEpc = lostRow.rows[0].int_epc;
          if (lostEpc === epc) {
            await query(
              `UPDATE inventory_items_temp
               SET inv_expected = true, inv_lost = false
               WHERE int_id = $1 AND int_epc = $2`,
              [username, epc]
            );
          } else {
            // Remove the generic lost placeholder and insert the real scanned EPC
            await query(
              'DELETE FROM inventory_items_temp WHERE int_id = $1 AND int_epc = $2',
              [username, lostEpc]
            );
            await query(
              `INSERT INTO inventory_items_temp (int_id, int_epc, inv_expected, inv_unexpected, inv_lost)
               VALUES ($1, $2, true, false, false)`,
              [username, epc]
            );
          }
        } else {
          // All expected qty already met → this extra one is unexpected
          await query(
            `INSERT INTO inventory_items_temp (int_id, int_epc, inv_expected, inv_unexpected, inv_lost)
             VALUES ($1, $2, false, true, false)`,
            [username, epc]
          );
        }
        return NextResponse.json({ status: 'expected' });
      } else {
        // Product not in checklist → unexpected
        await query(
          `INSERT INTO inventory_items_temp (int_id, int_epc, inv_expected, inv_unexpected, inv_lost)
           VALUES ($1, $2, false, true, false)`,
          [username, epc]
        );
        return NextResponse.json({ status: 'unexpected' });
      }
    }

    return NextResponse.json({ error: 'Tipo non valido' }, { status: 400 });
  } catch (error: any) {
    console.error('Error processing scan:', error);
    return NextResponse.json({ error: error.message || 'Errore elaborazione lettura' }, { status: 500 });
  }
}
