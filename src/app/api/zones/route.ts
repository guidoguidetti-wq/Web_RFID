import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT * FROM "Zones" ORDER BY zone_id ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Errore nel recupero zones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { zone_id, zone_name, zone_type } = await req.json();
    const result = await query(
      'INSERT INTO "Zones" (zone_id, zone_name, zone_type) VALUES ($1, $2, $3) RETURNING *',
      [zone_id, zone_name, zone_type]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Errore nella creazione zone' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { zone_id, zone_name, zone_type } = await req.json();
    const result = await query(
      'UPDATE "Zones" SET zone_name = $1, zone_type = $2 WHERE zone_id = $3 RETURNING *',
      [zone_name, zone_type, zone_id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Errore nell\'aggiornamento zone' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await query('DELETE FROM "Zones" WHERE zone_id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Errore nella cancellazione zone' }, { status: 500 });
  }
}
