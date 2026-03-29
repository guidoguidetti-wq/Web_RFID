import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/* ─────────────────────────────────────────────────────────────
   GET /api/bett/manuali?uid=...
   Restituisce:
     - epc dell'item (per verificare se la garanzia è attivata)
     - lista file con att_type = 'Files (Manuali)' collegati al lotto
───────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get('uid') ?? searchParams.get('UID');

  if (!uid) return NextResponse.json({ error: 'UID mancante' }, { status: 400 });

  try {
    const itemResult = await query(
      'SELECT epc, lotto FROM "Items" WHERE item_id = $1',
      [uid]
    );
    if (itemResult.rows.length === 0)
      return NextResponse.json({ error: 'Item non trovato' }, { status: 404 });

    const { epc, lotto } = itemResult.rows[0];

    let files: any[] = [];
    if (lotto) {
      const woResult = await query(
        'SELECT wo_id FROM work_orders WHERE wo_number = $1 LIMIT 1',
        [lotto]
      );
      if (woResult.rows.length > 0) {
        const wo_id = woResult.rows[0].wo_id;
        const attachResult = await query(
          `SELECT att_id, att_filename, att_url, att_mime, att_size, att_seen, att_down
           FROM work_orders_attach
           WHERE att_wo_id = $1 AND att_type = 'Files (Manuali)'
           ORDER BY att_created_at ASC`,
          [wo_id]
        );
        files = attachResult.rows;
      }
    }

    return NextResponse.json({ epc: epc ?? null, files });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Errore database' }, { status: 500 });
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/bett/manuali
   Body: { att_id, action: 'seen' | 'down' }
   Scrive att_seen o att_down se ancora null, poi restituisce i valori aggiornati
───────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const { att_id, action } = await req.json();
    if (!att_id || !['seen', 'down'].includes(action))
      return NextResponse.json({ error: 'Parametri non validi' }, { status: 400 });

    const col = action === 'seen' ? 'att_seen' : 'att_down';
    const label = action === 'seen' ? 'Visualizzato' : 'Scaricato';

    /* Controlla stato attuale */
    const current = await query(
      `SELECT att_seen, att_down FROM work_orders_attach WHERE att_id = $1`,
      [att_id]
    );
    if (current.rows.length === 0)
      return NextResponse.json({ error: 'Allegato non trovato' }, { status: 404 });

    /* Aggiorna solo se ancora null */
    if (current.rows[0][col] === null) {
      const now = new Date();
      const dateTimeStr = now.toLocaleDateString('it-IT', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      }) + ' ' + now.toLocaleTimeString('it-IT', {
        hour: '2-digit', minute: '2-digit',
      });
      const value = `${label} il ${dateTimeStr}`;
      await query(`UPDATE work_orders_attach SET ${col} = $1 WHERE att_id = $2`, [value, att_id]);

      /* Ritorna riga aggiornata */
      const updated = await query(
        `SELECT att_seen, att_down FROM work_orders_attach WHERE att_id = $1`,
        [att_id]
      );
      return NextResponse.json({ ok: true, ...updated.rows[0] });
    }

    return NextResponse.json({ ok: true, ...current.rows[0] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Errore database' }, { status: 500 });
  }
}
