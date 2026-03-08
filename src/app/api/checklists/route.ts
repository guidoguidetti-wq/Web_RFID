import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const place = searchParams.get('place');

    let sql = 'SELECT chk_id, chk_code, chk_place, chk_zone, chk_notes, chk_creationdate FROM "checklist"';
    const params: any[] = [];

    if (place) {
      sql += ' WHERE chk_place = $1';
      params.push(place);
    }

    sql += ' ORDER BY chk_code ASC';

    const result = await query(sql, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching checklists:', error);
    return NextResponse.json({ error: 'Errore nel recupero checklist' }, { status: 500 });
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
  } catch (error) {
    console.error('Error creating checklist:', error);
    return NextResponse.json({ error: 'Errore nella creazione checklist' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { chk_id, chk_code, chk_place, chk_zone, chk_notes, chk_creationdate } = await req.json();
    const result = await query(
      'UPDATE "checklist" SET chk_code=$1, chk_place=$2, chk_zone=$3, chk_notes=$4, chk_creationdate=$5 WHERE chk_id=$6 RETURNING *',
      [chk_code, chk_place || null, chk_zone || null, chk_notes || null, chk_creationdate || null, chk_id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating checklist:', error);
    return NextResponse.json({ error: "Errore nell'aggiornamento checklist" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await query('DELETE FROM "checklist" WHERE chk_id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    return NextResponse.json({ error: 'Errore nella cancellazione checklist' }, { status: 500 });
  }
}
