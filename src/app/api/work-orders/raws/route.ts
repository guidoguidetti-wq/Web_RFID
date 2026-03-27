import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// ── GET – righe di un work order (join Products per descrizione) ───────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const woId = searchParams.get('wo_id');
  if (!woId) return NextResponse.json({ error: 'wo_id mancante' }, { status: 400 });

  try {
    const res = await query(
      `SELECT r.*,
              p.fld02  AS sku_description,
              p.fldd01 AS sku_info
       FROM work_orders_raws r
       LEFT JOIN "Products" p ON p.product_id = r.wor_sku
       WHERE r.wor_wo_id = $1
       ORDER BY r.wor_id ASC`,
      [woId]
    );
    return NextResponse.json(res.rows);
  } catch (err: any) {
    console.error('GET raws:', err);
    return NextResponse.json({ error: 'Errore lettura righe', detail: err?.message }, { status: 500 });
  }
}

// ── POST – inserisci riga ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wor_wo_id, wor_sku, wor_qta, wor_printed } = body;

    if (!wor_wo_id || !wor_sku) {
      return NextResponse.json({ error: 'wor_wo_id e wor_sku obbligatori' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO work_orders_raws (wor_wo_id, wor_sku, wor_qta, wor_printed)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [wor_wo_id, wor_sku, wor_qta ?? 1, wor_printed ?? 0]
    );

    // Arricchisce con descrizione prodotto
    const row = res.rows[0];
    const prod = await query(
      `SELECT fld02 AS sku_description, fldd01 AS sku_info FROM "Products" WHERE product_id = $1`,
      [row.wor_sku]
    ).catch(() => ({ rows: [] }));

    return NextResponse.json({ ...row, ...(prod.rows[0] ?? {}) }, { status: 201 });
  } catch (err: any) {
    console.error('POST raws:', err);
    return NextResponse.json({ error: 'Errore inserimento riga', detail: err?.message }, { status: 500 });
  }
}

// ── PUT – aggiorna riga (qta e/o printed) ────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { wor_id, wor_sku, wor_qta, wor_printed } = body;

    if (!wor_id) return NextResponse.json({ error: 'wor_id mancante' }, { status: 400 });

    const res = await query(
      `UPDATE work_orders_raws
       SET wor_sku     = COALESCE($2, wor_sku),
           wor_qta     = COALESCE($3, wor_qta),
           wor_printed = COALESCE($4, wor_printed)
       WHERE wor_id = $1
       RETURNING *`,
      [wor_id, wor_sku ?? null, wor_qta ?? null, wor_printed ?? null]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Riga non trovata' }, { status: 404 });
    }

    const row = res.rows[0];
    const prod = await query(
      `SELECT fld02 AS sku_description, fldd01 AS sku_info FROM "Products" WHERE product_id = $1`,
      [row.wor_sku]
    ).catch(() => ({ rows: [] }));

    return NextResponse.json({ ...row, ...(prod.rows[0] ?? {}) });
  } catch (err: any) {
    console.error('PUT raws:', err);
    return NextResponse.json({ error: "Errore aggiornamento riga", detail: err?.message }, { status: 500 });
  }
}

// ── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id mancante' }, { status: 400 });

    const res = await query('DELETE FROM work_orders_raws WHERE wor_id = $1', [id]);
    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Riga non trovata' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE raws:', err);
    return NextResponse.json({ error: 'Errore cancellazione riga', detail: err?.message }, { status: 500 });
  }
}
