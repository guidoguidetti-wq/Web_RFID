import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const section = searchParams.get('section');
    const limit   = parseInt(searchParams.get('limit') || '200');

    const result = section
      ? await query(
          'SELECT * FROM log WHERE log_section = $1 ORDER BY log_id DESC LIMIT $2',
          [section, limit]
        )
      : await query(
          'SELECT * FROM log ORDER BY log_id DESC LIMIT $1',
          [limit]
        );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await query('DELETE FROM log');
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { log_user, log_section, log_text } = await req.json();
    await query(
      'INSERT INTO log (log_user, log_section, log_text) VALUES ($1, $2, $3)',
      [log_user ?? 'system', log_section ?? '', log_text ?? '']
    );
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
