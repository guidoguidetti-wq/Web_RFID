import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const epc = searchParams.get('epc');

    if (!epc) {
      return NextResponse.json({ error: 'EPC mancante' }, { status: 400 });
    }

    const result = await query(
      `SELECT i.item_id, i.item_product_id,
              p.fld01, p.fld02, p.fld03, p.fldd01
       FROM "Items" i
       LEFT JOIN "Products" p ON i.item_product_id = p.product_id
       WHERE i.item_id = $1`,
      [epc]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ epc, status: 'unknown', fld01: null, fld02: null, fld03: null, fldd01: null });
    }

    const row = result.rows[0];
    return NextResponse.json({
      epc,
      status: 'valid',
      fld01: row.fld01,
      fld02: row.fld02,
      fld03: row.fld03,
      fldd01: row.fldd01,
    });
  } catch (error) {
    console.error('Error in hid-reads:', error);
    return NextResponse.json({ error: 'Errore nella lettura EPC' }, { status: 500 });
  }
}
