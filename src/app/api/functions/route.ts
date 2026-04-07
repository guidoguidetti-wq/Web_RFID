import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT * FROM functions ORDER BY fun_id ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Errore nel recupero funzioni' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fun_label } = await req.json();
    const result = await query(
      'INSERT INTO functions (fun_label) VALUES ($1) RETURNING *',
      [fun_label]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Errore nella creazione funzione' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { fun_id, fun_label } = await req.json();
    const result = await query(
      'UPDATE functions SET fun_label = $1 WHERE fun_id = $2 RETURNING *',
      [fun_label, fun_id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: "Errore nell'aggiornamento funzione" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await query('DELETE FROM functions WHERE fun_id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Errore nella cancellazione funzione' }, { status: 500 });
  }
}
