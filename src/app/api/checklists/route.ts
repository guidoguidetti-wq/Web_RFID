import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const place = searchParams.get('place');

    let sql = 'SELECT chk_id, chk_code FROM "checklist"';
    const params = [];

    if (place) {
      sql += ' WHERE chk_place = $1';
      params.push(place);
    }

    sql += ' ORDER BY chk_code ASC';

    const result = await query(sql, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching checklists:', error);
    return NextResponse.json({ error: 'Errore nel recupero checklist' }, { status: 500 });
  }
}
