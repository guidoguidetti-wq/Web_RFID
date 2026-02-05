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
