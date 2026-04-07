import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { username, type, checklist_id } = await req.json();

    if (!username || !type) {
      return NextResponse.json({ error: 'username e type richiesti' }, { status: 400 });
    }

    // Clear previous session for this user
    await query('DELETE FROM inventory_items_temp WHERE int_id = $1', [username]);

    // Pre-populate lost items based on type
    if (Number(type) === 3 && checklist_id) {
      // Type 3 – Checklist EPC: load all EPC from checklist_items, mark as lost
      await query(
        `INSERT INTO inventory_items_temp (int_id, int_epc, inv_expected, inv_unexpected, inv_lost)
         SELECT $1, ci.ckp_epc_id, false, false, true
         FROM checklist_items ci
         WHERE ci.ckp_chl_id = $2 AND ci.ckp_epc_id IS NOT NULL`,
        [username, checklist_id]
      );
    } else if (Number(type) === 2 && checklist_id) {
      // Type 2 – Checklist SKU: load all Items for each product in checklist, mark as lost
      await query(
        `INSERT INTO inventory_items_temp (int_id, int_epc, inv_expected, inv_unexpected, inv_lost)
         SELECT $1, i.item_id, false, false, true
         FROM checklist_products cp
         JOIN "Items" i ON i.item_product_id = cp.ckp_product_id
         WHERE cp.ckp_chl_id = $2`,
        [username, checklist_id]
      );
    }
    // Type 4 – No Checklist: nothing to pre-populate

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error starting reading session:', error);
    return NextResponse.json({ error: error.message || 'Errore avvio sessione' }, { status: 500 });
  }
}
