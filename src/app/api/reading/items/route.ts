import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'username richiesto' }, { status: 400 });
    }

    const result = await query(
      `SELECT
         t.int_epc   AS "EPC",
         t.inv_expected,
         t.inv_unexpected,
         t.inv_lost,
         i.item_product_id AS "Product ID",
         p.fld01,
         p.fld02,
         p.fld03,
         p.fldd01,
         p.fldd02
       FROM inventory_items_temp t
       LEFT JOIN "Items"    i ON i.item_id = t.int_epc
       LEFT JOIN "Products" p ON p.product_id = i.item_product_id
       WHERE t.int_id = $1
       ORDER BY
         t.inv_lost DESC,
         t.inv_unexpected DESC,
         t.inv_expected DESC`,
      [username]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching reading items:', error);
    return NextResponse.json({ error: error.message || 'Errore recupero letture' }, { status: 500 });
  }
}
