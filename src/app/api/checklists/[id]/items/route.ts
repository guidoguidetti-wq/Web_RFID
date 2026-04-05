import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: chkId } = await params;

    // Get column info for the frontend
    const colsResult = await query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'checklist_items'
       ORDER BY ordinal_position`,
      []
    );

    const rows = await query(
      `SELECT * FROM checklist_items WHERE chi_chk_id = $1 ORDER BY chi_id ASC`,
      [chkId]
    );

    return NextResponse.json({ columns: colsResult.rows, items: rows.rows });
  } catch (error: any) {
    console.error('Error fetching checklist_items:', error);
    return NextResponse.json({ error: 'Errore nel recupero checklist_items', detail: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: chkId } = await params;
    const body = await req.json();

    const keys = Object.keys(body).filter(k => k !== 'chi_id');
    if (!keys.includes('chi_chk_id')) {
      keys.push('chi_chk_id');
      body['chi_chk_id'] = chkId;
    }

    const cols = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const values = keys.map(k => body[k]);

    const result = await query(
      `INSERT INTO checklist_items (${cols}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error inserting checklist_item:', error);
    return NextResponse.json({ error: 'Errore nella creazione', detail: error?.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { chi_id, ...fields } = body;

    if (!chi_id) return NextResponse.json({ error: 'chi_id mancante' }, { status: 400 });

    const keys = Object.keys(fields);
    if (keys.length === 0) return NextResponse.json({ error: 'Nessun campo da aggiornare' }, { status: 400 });

    const setClause = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
    const values = [chi_id, ...keys.map(k => fields[k])];

    const result = await query(
      `UPDATE checklist_items SET ${setClause} WHERE chi_id = $1 RETURNING *`,
      values
    );
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating checklist_item:', error);
    return NextResponse.json({ error: "Errore nell'aggiornamento", detail: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

    await query('DELETE FROM checklist_items WHERE chi_id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting checklist_item:', error);
    return NextResponse.json({ error: 'Errore nella cancellazione', detail: error?.message }, { status: 500 });
  }
}
