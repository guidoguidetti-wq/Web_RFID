import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT * FROM "Places" ORDER BY place_id ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Errore nel recupero places' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { place_id, place_name, place_type } = await req.json();
    const result = await query(
      'INSERT INTO "Places" (place_id, place_name, place_type) VALUES ($1, $2, $3) RETURNING *',
      [place_id, place_name, place_type]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Errore nella creazione place' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { place_id, place_name, place_type } = await req.json();
    const result = await query(
      'UPDATE "Places" SET place_name = $1, place_type = $2 WHERE place_id = $3 RETURNING *',
      [place_name, place_type, place_id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Errore nell\'aggiornamento place' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await query('DELETE FROM "Places" WHERE place_id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Errore nella cancellazione place' }, { status: 500 });
  }
}
