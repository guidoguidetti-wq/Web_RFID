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
    const items = await query(
      `SELECT table_schema, column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'checklist_items'
       ORDER BY table_schema, ordinal_position`,
      []
    );
    const allTables = await query(
      `SELECT table_schema, table_name
       FROM information_schema.tables
       WHERE table_name ILIKE '%checklist%' OR table_name ILIKE '%item%'
       ORDER BY table_schema, table_name`,
      []
    );
    return NextResponse.json({
      checklist_columns: cols.rows,
      checklist_products_columns: prods.rows,
      checklist_items_columns: items.rows,
      related_tables: allTables.rows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
