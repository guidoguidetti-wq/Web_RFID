import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await query(
      `SELECT cp.ckp_id, cp.ckp_chl_id, cp.ckp_product_id,
              cp.ckp_qta, cp.ckp_qta_exp, cp.ckp_qta_unexp, cp.ckp_qta_missing,
              p.fld01 AS product_name
       FROM checklist_products cp
       LEFT JOIN "Products" p ON p.product_id = cp.ckp_product_id
       WHERE cp.ckp_chl_id = $1
       ORDER BY cp.ckp_id ASC`,
      [id]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching checklist products:', error);
    return NextResponse.json({ error: 'Errore nel recupero prodotti checklist' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { ckp_product_id, ckp_qta, ckp_qta_exp, ckp_qta_unexp, ckp_qta_missing } = await req.json();
    const result = await query(
      `INSERT INTO checklist_products (ckp_chl_id, ckp_product_id, ckp_qta, ckp_qta_exp, ckp_qta_unexp, ckp_qta_missing)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, ckp_product_id || null, ckp_qta || null, ckp_qta_exp || null, ckp_qta_unexp || null, ckp_qta_missing || null]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating checklist product:', error);
    return NextResponse.json({ error: 'Errore nella creazione prodotto checklist' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { ckp_id, ckp_product_id, ckp_qta, ckp_qta_exp, ckp_qta_unexp, ckp_qta_missing } = await req.json();
    const result = await query(
      `UPDATE checklist_products
       SET ckp_product_id=$1, ckp_qta=$2, ckp_qta_exp=$3, ckp_qta_unexp=$4, ckp_qta_missing=$5
       WHERE ckp_id=$6 RETURNING *`,
      [ckp_product_id || null, ckp_qta || null, ckp_qta_exp || null, ckp_qta_unexp || null, ckp_qta_missing || null, ckp_id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating checklist product:', error);
    return NextResponse.json({ error: "Errore nell'aggiornamento prodotto checklist" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await query('DELETE FROM checklist_products WHERE ckp_id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting checklist product:', error);
    return NextResponse.json({ error: 'Errore nella cancellazione prodotto checklist' }, { status: 500 });
  }
}
