import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT field_name as pr_fld, label_text as pr_lab, label_text as pr_des FROM "Products_labels" ORDER BY field_name');
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Errore nel recupero labels prodotti' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const fieldName = body.pr_fld ?? body.field_name;
    const labelText = body.pr_lab ?? body.label_text ?? '';
    if (!fieldName) return NextResponse.json({ error: 'Campo obbligatorio' }, { status: 400 });
    await query(
      'INSERT INTO "Products_labels" (field_name, label_text) VALUES ($1, $2)',
      [fieldName, labelText]
    );
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const fieldName = body.pr_fld ?? body.field_name;
    const labelText = body.pr_lab ?? body.label_text ?? '';
    if (!fieldName) return NextResponse.json({ error: 'Campo obbligatorio' }, { status: 400 });
    await query(
      'UPDATE "Products_labels" SET label_text = $2 WHERE field_name = $1',
      [fieldName, labelText]
    );
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id obbligatorio' }, { status: 400 });
    await query('DELETE FROM "Products_labels" WHERE field_name = $1', [id]);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
