import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/* GET /api/bett/garanzia?uid=... → restituisce epc e date_creation */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid') ?? searchParams.get('UID');

  if (!uid) return NextResponse.json({ error: 'UID mancante' }, { status: 400 });

  try {
    const result = await query(
      'SELECT epc, date_creation FROM "Items" WHERE item_id = $1',
      [uid]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Item non trovato' }, { status: 404 });
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Errore database' }, { status: 500 });
  }
}

/* POST /api/bett/garanzia  body: { uid } → scrive epc se ancora null */
export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();
    if (!uid) return NextResponse.json({ error: 'UID mancante' }, { status: 400 });

    /* Verifica che epc sia ancora null */
    const check = await query('SELECT epc FROM "Items" WHERE item_id = $1', [uid]);
    if (check.rows.length === 0) return NextResponse.json({ error: 'Item non trovato' }, { status: 404 });
    if (check.rows[0].epc !== null) {
      return NextResponse.json({ error: 'Garanzia già attivata', epc: check.rows[0].epc }, { status: 409 });
    }

    /* Formatta la data in italiano */
    const now = new Date();
    const dateStr = now.toLocaleDateString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    const epcValue = `Garanzia Attivata il ${dateStr}`;

    await query('UPDATE "Items" SET epc = $1 WHERE item_id = $2', [epcValue, uid]);
    return NextResponse.json({ ok: true, epc: epcValue });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Errore database' }, { status: 500 });
  }
}
