import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const place = searchParams.get('place');

    const params: any[] = [];
    const whereClause = place ? ' WHERE c.chk_place = $1' : '';
    if (place) params.push(place);

    // Try with n_items subquery; fall back gracefully if checklist_items table doesn't exist yet
    let rows: any[];
    try {
      const result = await query(
        `SELECT c.*,
          (SELECT COUNT(*)::int FROM checklist_products WHERE ckp_chl_id = c.chk_id) AS n_products,
          (SELECT COUNT(*)::int FROM checklist_items WHERE chi_chk_id = c.chk_id) AS n_items
         FROM "checklist" c${whereClause} ORDER BY c.chk_code ASC`,
        params
      );
      rows = result.rows;
    } catch {
      // checklist_items table may not exist yet — return 0 for n_items
      const result = await query(
        `SELECT c.*,
          (SELECT COUNT(*)::int FROM checklist_products WHERE ckp_chl_id = c.chk_id) AS n_products,
          0 AS n_items
         FROM "checklist" c${whereClause} ORDER BY c.chk_code ASC`,
        params
      );
      rows = result.rows;
    }

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching checklists:', error);
    return NextResponse.json({ error: 'Errore nel recupero checklist', detail: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { chk_code, chk_place, chk_zone, chk_notes, chk_creationdate } = await req.json();
    const result = await query(
      'INSERT INTO "checklist" (chk_code, chk_place, chk_zone, chk_notes, chk_creationdate) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [chk_code, chk_place || null, chk_zone || null, chk_notes || null, chk_creationdate || null]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating checklist:', error);
    return NextResponse.json({ error: 'Errore nella creazione checklist', detail: error?.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { chk_id, chk_code, chk_place, chk_zone, chk_notes, chk_creationdate } = body;
    console.log('PUT checklist body:', JSON.stringify(body));

    if (!chk_id) {
      return NextResponse.json({ error: 'chk_id mancante nel body', body }, { status: 400 });
    }

    const result = await query(
      'UPDATE "checklist" SET chk_code=$1, chk_place=$2, chk_zone=$3, chk_notes=$4, chk_creationdate=$5 WHERE chk_id=$6 RETURNING *',
      [chk_code || null, chk_place || null, chk_zone || null, chk_notes || null, chk_creationdate || null, chk_id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: `Nessun record con chk_id=${chk_id}` }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating checklist:', error);
    return NextResponse.json({ error: "Errore nell'aggiornamento checklist", detail: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await query('DELETE FROM "checklist" WHERE chk_id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting checklist:', error);
    return NextResponse.json({ error: 'Errore nella cancellazione checklist', detail: error?.message }, { status: 500 });
  }
}
