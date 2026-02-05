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
        ii.int_epc as "EPC",
        ii.inv_expected,
        ii.inv_unexpected,
        ii.inv_lost,
        it.item_product_id as "Product ID",
        p.fld01, 
        p.fld02, 
        p.fld03, 
        p.fldd01, 
        p.fldd02
      FROM "inventory_items" ii
      LEFT JOIN "Items" it ON ii.int_epc = it.item_id
      LEFT JOIN "Products" p ON it.item_product_id = p.product_id
      WHERE ii.int_inv_id = $1
    `;

    const result = await query(sql, [id]);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    return NextResponse.json({ error: 'Errore nel recupero items inventario' }, { status: 500 });
  }
}
