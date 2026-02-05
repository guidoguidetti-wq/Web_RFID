import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const sql = `
      SELECT 
        it.item_product_id as "Product ID",
        p.fld01, 
        p.fld02, 
        p.fld03, 
        p.fldd01, 
        p.fldd02,
        COUNT(ii.int_epc)::int as "Qty",
        SUM(CASE WHEN ii.inv_expected THEN 1 ELSE 0 END)::int as "Expected Qty",
        SUM(CASE WHEN ii.inv_unexpected THEN 1 ELSE 0 END)::int as "Unexpected Qty",
        SUM(CASE WHEN ii.inv_lost THEN 1 ELSE 0 END)::int as "Lost Qty"
      FROM "inventory_items" ii
      LEFT JOIN "Items" it ON ii.int_epc = it.item_id
      LEFT JOIN "Products" p ON it.item_product_id = p.product_id
      WHERE ii.int_inv_id = $1
      GROUP BY it.item_product_id, p.fld01, p.fld02, p.fld03, p.fldd01, p.fldd02
      ORDER BY it.item_product_id ASC
    `;

    const result = await query(sql, [id]);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching aggregated inventory items:', error);
    return NextResponse.json({ error: 'Errore nel recupero items aggregati' }, { status: 500 });
  }
}
