import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const cols = await query(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'checklist'
       ORDER BY ordinal_position`,
      []
    );
    const prods = await query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'checklist_products'
       ORDER BY ordinal_position`,
      []
    );
    return NextResponse.json({
      checklist_columns: cols.rows,
      checklist_products_columns: prods.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
