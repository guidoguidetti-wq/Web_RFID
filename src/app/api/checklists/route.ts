import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const place = searchParams.get('place');

    let sql = 'SELECT * FROM "checklist"';
    const params: any[] = [];

    if (place) {
      sql += ' WHERE chk_place = $1';
      params.push(place);
    }

    sql += ' ORDER BY chk_code ASC';

    const result = await query(sql, params);
    return NextResponse.json(result.rows);
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
