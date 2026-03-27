import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { query } from '@/lib/db';

const IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

// ── GET – lista allegati per una work order ───────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const woId = searchParams.get('wo_id');
  if (!woId) return NextResponse.json({ error: 'wo_id mancante' }, { status: 400 });

  try {
    const res = await query(
      `SELECT * FROM work_orders_attach WHERE att_wo_id = $1 ORDER BY att_created_at ASC`,
      [woId]
    );
    return NextResponse.json(res.rows);
  } catch (err: any) {
    return NextResponse.json({ error: 'Errore lettura allegati', detail: err?.message }, { status: 500 });
  }
}

// ── POST – salva metadati allegato già caricato su Vercel Blob ─────────────────
// Il file viene caricato direttamente dal browser tramite /api/work-orders/attach/token
// Questo endpoint salva solo il record nel DB.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { wo_id, att_url, att_filename, att_mime, att_size, att_note } = body;

    if (!wo_id || !att_url || !att_filename) {
      return NextResponse.json({ error: 'wo_id, att_url e att_filename obbligatori' }, { status: 400 });
    }

    const isImage = IMAGE_MIMES.includes(att_mime ?? '');
    const att_type = isImage ? 'image' : 'file';

    const res = await query(
      `INSERT INTO work_orders_attach
         (att_wo_id, att_filename, att_type, att_mime, att_size, att_url, att_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [wo_id, att_filename, att_type, att_mime ?? null, att_size ?? null, att_url, att_note || null]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (err: any) {
    console.error('POST attach:', err);
    return NextResponse.json({ error: 'Errore salvataggio allegato', detail: err?.message }, { status: 500 });
  }
}

// ── DELETE – rimuove da Vercel Blob e da DB ───────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

    const res = await query(
      'SELECT att_url FROM work_orders_attach WHERE att_id = $1',
      [id]
    );
    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Allegato non trovato' }, { status: 404 });
    }

    const url: string = res.rows[0].att_url;
    if (url.includes('blob.vercel-storage.com') || url.includes('public.blob.vercel-storage.com')) {
      await del(url).catch(() => {});
    }

    await query('DELETE FROM work_orders_attach WHERE att_id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('DELETE attach:', err);
    return NextResponse.json({ error: 'Errore cancellazione allegato', detail: err?.message }, { status: 500 });
  }
}
