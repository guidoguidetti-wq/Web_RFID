import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/* GET /api/bett/garanzia?uid=... → restituisce epc, date_creation e documento garanzia */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid') ?? searchParams.get('UID');

  if (!uid) return NextResponse.json({ error: 'UID mancante' }, { status: 400 });

  try {
    const result = await query(
      'SELECT epc, date_creation, lotto FROM "Items" WHERE item_id = $1',
      [uid]
    );
    if (result.rows.length === 0) return NextResponse.json({ error: 'Item non trovato' }, { status: 404 });

    const item = result.rows[0];

    /* Cerca documento garanzia (att_type = 'Altro') tramite lotto → work_order */
    let docUrl: string | null = null;
    let docFilename: string | null = null;
    if (item.lotto) {
      const woResult = await query(
        'SELECT wo_id FROM work_orders WHERE wo_number = $1 LIMIT 1',
        [item.lotto]
      );
      if (woResult.rows.length > 0) {
        const wo_id = woResult.rows[0].wo_id;
        const attachResult = await query(
          `SELECT att_url, att_filename FROM work_orders_attach
           WHERE att_wo_id = $1 AND att_type = 'Altro'
           ORDER BY att_created_at ASC LIMIT 1`,
          [wo_id]
        );
        if (attachResult.rows.length > 0) {
          docUrl      = attachResult.rows[0].att_url;
          docFilename = attachResult.rows[0].att_filename;
        }
      }
    }

    return NextResponse.json({
      epc:           item.epc ?? null,
      date_creation: item.date_creation,
      docUrl,
      docFilename,
    });
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
