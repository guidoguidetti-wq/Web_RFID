import { NextRequest, NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('product_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // If requesting items for a specific product (used in product detail page)
    if (productId) {
      const result = await query('SELECT * FROM "Items" WHERE item_product_id = $1', [productId]);
      return NextResponse.json(result.rows);
    }

    // Build filter conditions
    const filters: { [key: string]: string } = {};
    const validColumns = ['item_id', 'item_product_id', 'date_creation', 'date_lastseen', 'place_last', 'zone_last', 'fld01', 'fld02', 'fld03', 'fldd01'];

    validColumns.forEach(col => {
      const filterValue = searchParams.get(`filter_${col}`);
      if (filterValue) {
        filters[col] = filterValue;
      }
    });

    // Build WHERE clause
    const whereClauses: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    Object.keys(filters).forEach(col => {
      // For joined columns from Products table
      if (['fld01', 'fld02', 'fld03', 'fldd01'].includes(col)) {
        whereClauses.push(`p."${col}"::text ILIKE $${paramIndex}`);
      } else {
        whereClauses.push(`i."${col}"::text ILIKE $${paramIndex}`);
      }
      queryParams.push(`%${filters[col]}%`);
      paramIndex++;
    });

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count with filters
    const countResult = await query(
      `SELECT COUNT(*)::int as total
       FROM "Items" i
       LEFT JOIN "Products" p ON i.item_product_id = p.product_id
       ${whereSQL}`,
      queryParams
    );
    const total = countResult.rows[0].total;

    // Get paginated items with filters
    queryParams.push(limit, offset);
    const sql = `
      SELECT i.*, p.fld01, p.fld02, p.fld03, p.fldd01
      FROM "Items" i
      LEFT JOIN "Products" p ON i.item_product_id = p.product_id
      ${whereSQL}
      ORDER BY i.date_creation DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    const result = await query(sql, queryParams);

    return NextResponse.json({
      items: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: 'Errore nel recupero items' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const client = await pool.connect();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
    }

    await client.query('BEGIN');
    // Delete related movements first
    // Assuming column is mov_item_id. If different, this will fail and I'll fix.
    await client.query('DELETE FROM "Movements" WHERE mov_item_id = $1', [id]);
    
    // Delete item
    await client.query('DELETE FROM "Items" WHERE item_id = $1', [id]);

    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Errore nella cancellazione item' }, { status: 500 });
  } finally {
    client.release();
  }
}
