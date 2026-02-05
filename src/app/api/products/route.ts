import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build filter conditions
    const filters: { [key: string]: string } = {};
    const validColumns = ['product_id', 'fld01', 'fld02', 'fld03', 'fld04', 'fld05', 'fld06', 'fld07', 'fld08', 'fld09', 'fld10', 'fldd01', 'fldd02', 'fldd03', 'fldd04', 'fldd05'];

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
      whereClauses.push(`"${col}"::text ILIKE $${paramIndex}`);
      queryParams.push(`%${filters[col]}%`);
      paramIndex++;
    });

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count with filters
    const countResult = await query(
      `SELECT COUNT(*)::int as total FROM "Products" ${whereSQL}`,
      queryParams
    );
    const total = countResult.rows[0].total;

    // Get paginated products with filters
    queryParams.push(limit, offset);
    const result = await query(
      `SELECT * FROM "Products" ${whereSQL} ORDER BY product_id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    );

    return NextResponse.json({
      products: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Errore nel recupero prodotti' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const keys = Object.keys(body);
    
    // Check for valid columns, including product_id if provided
    const validColumns = keys.filter(key => /^(fld\d+|fldd\d+)$/.test(key) || key === 'product_id');
    
    if (validColumns.length === 0) {
        return NextResponse.json({ error: 'Nessun dato valido da inserire' }, { status: 400 });
    }

    const columns = validColumns.map(k => `"${k}"`).join(', ');
    const placeholders = validColumns.map((_, i) => `$${i + 1}`).join(', ');
    const values = validColumns.map(k => body[k]);

    const sql = `INSERT INTO "Products" (${columns}) VALUES (${placeholders}) RETURNING product_id`;
    
    const result = await query(sql, values);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    // Handle unique constraint violation for product_id
    if (error.code === '23505') {
        return NextResponse.json({ error: 'ID Prodotto già esistente' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Errore nella creazione prodotto' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { product_id, ...updates } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'Product ID mancante' }, { status: 400 });
    }

    const keys = Object.keys(updates).filter(key => /^(fld\d+|fldd\d+)$/.test(key));

    if (keys.length === 0) {
      return NextResponse.json({ error: 'Nessun dato da aggiornare' }, { status: 400 });
    }

    const setClause = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
    const values = [product_id, ...keys.map(k => updates[k])];

    const sql = `UPDATE "Products" SET ${setClause} WHERE product_id = $1 RETURNING *`;
    
    const result = await query(sql, values);

    if (result.rowCount === 0) {
       return NextResponse.json({ error: 'Prodotto non trovato' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Errore nell\'aggiornamento prodotto' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
    }

    // Check for existing items
    const itemsCheck = await query('SELECT count(*) as count FROM "Items" WHERE item_product_id = $1', [id]);
    if (parseInt(itemsCheck.rows[0].count) > 0) {
      return NextResponse.json({ error: 'Impossibile eliminare: esistono items collegati a questo prodotto.' }, { status: 400 });
    }

    await query('DELETE FROM "Products" WHERE product_id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Errore nella cancellazione prodotto' }, { status: 500 });
  }
}
