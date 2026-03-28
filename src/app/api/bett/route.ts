import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('UID') ?? searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({ error: 'UID mancante' }, { status: 400 });
  }

  try {
    // 1. Look up item by UID
    const itemResult = await query(
      'SELECT * FROM "Items" WHERE item_id = $1',
      [uid]
    );

    if (itemResult.rows.length === 0) {
      return NextResponse.json({ found: false });
    }

    const item = itemResult.rows[0];

    // 2. Look up product
    const productResult = await query(
      'SELECT * FROM "Products" WHERE product_id = $1',
      [item.item_product_id]
    );
    const product = productResult.rows[0] ?? null;

    // 3. Look up work_order by lotto → wo_id
    let productImage: string | null = null;
    if (item.lotto) {
      const woResult = await query(
        'SELECT wo_id FROM work_orders WHERE wo_number = $1 LIMIT 1',
        [item.lotto]
      );
      if (woResult.rows.length > 0) {
        const wo_id = woResult.rows[0].wo_id;
        // 4. Get primary image attachment
        const attachResult = await query(
          `SELECT att_url FROM work_orders_attach
           WHERE att_wo_id = $1 AND att_type = 'Image'
           ORDER BY att_created_at ASC LIMIT 1`,
          [wo_id]
        );
        if (attachResult.rows.length > 0) {
          productImage = attachResult.rows[0].att_url;
        }
      }
    }

    return NextResponse.json({ found: true, item, product, productImage });
  } catch (error) {
    console.error('Error in bett lookup:', error);
    return NextResponse.json({ error: 'Errore database' }, { status: 500 });
  }
}
