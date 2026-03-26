import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// ── GET  (list + filter + pagination) ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page   = parseInt(searchParams.get('page')  || '1');
    const limit  = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const filterCols = ['wo_number','wo_title','wo_status','wo_priority','wo_assigned_to','wo_item_id'];
    const whereClauses: string[] = [];
    const params: any[] = [];
    let idx = 1;

    filterCols.forEach(col => {
      const v = searchParams.get(`filter_${col}`);
      if (v) {
        whereClauses.push(`"${col}"::text ILIKE $${idx++}`);
        params.push(`%${v}%`);
      }
    });

    const where = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*)::int AS total FROM work_orders ${where}`,
      params
    );
    const total = countRes.rows[0].total;

    params.push(limit, offset);
    const dataRes = await query(
      `SELECT w.*,
              (SELECT COUNT(*)::int FROM work_orders_attach WHERE att_wo_id = w.wo_id) AS attach_count
       FROM work_orders w
       ${where}
       ORDER BY w.wo_created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      params
    );

    return NextResponse.json({
      workOrders: dataRes.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('GET work_orders:', err);
    return NextResponse.json({ error: 'Errore nel recupero work orders' }, { status: 500 });
  }
}

// ── POST (insert) ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wo_number, wo_title, wo_description, wo_status, wo_priority,
            wo_item_id, wo_assigned_to, wo_due_date, wo_notes } = body;

    if (!wo_number || !wo_title) {
      return NextResponse.json({ error: 'Numero e titolo obbligatori' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO work_orders
         (wo_number, wo_title, wo_description, wo_status, wo_priority,
          wo_item_id, wo_assigned_to, wo_due_date, wo_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        wo_number, wo_title, wo_description ?? null,
        wo_status ?? 'APERTO', wo_priority ?? 'NORMALE',
        wo_item_id || null, wo_assigned_to || null,
        wo_due_date || null, wo_notes || null,
      ]
    );
    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Numero WO già esistente' }, { status: 409 });
    }
    console.error('POST work_orders:', err);
    return NextResponse.json({ error: 'Errore nella creazione work order' }, { status: 500 });
  }
}

// ── PUT (update) ───────────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { wo_id, ...fields } = body;

    if (!wo_id) {
      return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
    }

    const allowed = ['wo_number','wo_title','wo_description','wo_status','wo_priority',
                     'wo_item_id','wo_assigned_to','wo_due_date','wo_notes'];
    const keys = Object.keys(fields).filter(k => allowed.includes(k));

    if (keys.length === 0) {
      return NextResponse.json({ error: 'Nessun campo da aggiornare' }, { status: 400 });
    }

    const set = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
    const values = [wo_id, ...keys.map(k => fields[k] || null)];

    const res = await query(
      `UPDATE work_orders SET ${set}, wo_updated_at = NOW() WHERE wo_id = $1 RETURNING *`,
      values
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Work order non trovato' }, { status: 404 });
    }
    return NextResponse.json(res.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Numero WO già esistente' }, { status: 409 });
    }
    console.error('PUT work_orders:', err);
    return NextResponse.json({ error: 'Errore nell\'aggiornamento' }, { status: 500 });
  }
}

// ── DELETE ─────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

    const res = await query('DELETE FROM work_orders WHERE wo_id = $1', [id]);
    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Work order non trovato' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE work_orders:', err);
    return NextResponse.json({ error: 'Errore nella cancellazione' }, { status: 500 });
  }
}
