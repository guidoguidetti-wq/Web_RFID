import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({ error: 'UID mancante' }, { status: 400 });
  }

  try {
    // Look up item by UID
    const itemResult = await query(
      'SELECT * FROM "Items" WHERE item_id = $1',
      [uid]
    );

    if (itemResult.rows.length === 0) {
      return NextResponse.json({ found: false });
    }

    const item = itemResult.rows[0];

    // Look up product
    const productResult = await query(
      'SELECT * FROM "Products" WHERE product_id = $1',
      [item.item_product_id]
    );

    const product = productResult.rows[0] ?? null;

    return NextResponse.json({ found: true, item, product });
  } catch (error) {
    console.error('Error in bett lookup:', error);
    return NextResponse.json({ error: 'Errore database' }, { status: 500 });
  }
}
