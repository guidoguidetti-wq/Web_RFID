import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { query } from '@/lib/db';

const IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const FILE_MIMES  = ['application/pdf'];
const MAX_SIZE    = 20 * 1024 * 1024; // 20 MB

// ── GET  – list attachments for a work order ───────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const woId = searchParams.get('wo_id');
  if (!woId) return NextResponse.json({ error: 'wo_id mancante' }, { status: 400 });

  const res = await query(
    `SELECT * FROM work_orders_attach WHERE att_wo_id = $1 ORDER BY att_created_at ASC`,
    [woId]
  );
  return NextResponse.json(res.rows);
}

// ── POST – upload file (image or pdf) to Vercel Blob + save to DB ──────────────
export async function POST(req: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'Vercel Blob Storage non configurato (BLOB_READ_WRITE_TOKEN mancante)' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file  = formData.get('file') as File | null;
    const woId  = formData.get('wo_id') as string | null;

    if (!file || !woId) {
      return NextResponse.json({ error: 'File e wo_id obbligatori' }, { status: 400 });
    }

    const isImage = IMAGE_MIMES.includes(file.type);
    const isFile  = FILE_MIMES.includes(file.type);

    if (!isImage && !isFile) {
      return NextResponse.json(
        { error: 'Formato non supportato. Usa JPG, PNG, WebP, GIF o PDF.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File troppo grande. Massimo 20 MB.' }, { status: 400 });
    }

    const ext      = file.name.split('.').pop() ?? 'bin';
    const folder   = isImage ? 'work-orders/images' : 'work-orders/files';
    const blobName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const blob = await put(blobName, file, { access: 'public', addRandomSuffix: false });

    const res = await query(
      `INSERT INTO work_orders_attach
         (att_wo_id, att_filename, att_type, att_mime, att_size, att_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [woId, file.name, isImage ? 'image' : 'file', file.type, file.size, blob.url]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (err) {
    console.error('POST attach:', err);
    return NextResponse.json({ error: 'Errore durante il caricamento' }, { status: 500 });
  }
}

// ── DELETE – remove from Vercel Blob + DB ────────────────────────────────────
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
    if (url.includes('blob.vercel-storage.com')) {
      await del(url).catch(() => {}); // non bloccare se già cancellato
    }

    await query('DELETE FROM work_orders_attach WHERE att_id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE attach:', err);
    return NextResponse.json({ error: 'Errore nella cancellazione allegato' }, { status: 500 });
  }
}
