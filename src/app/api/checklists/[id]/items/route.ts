import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const TABLE  = 'checklist_items';
const PK     = 'ckp_id';
const FK     = 'ckp_chl_id';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: chkId } = await params;
    const rows = await query(
      `SELECT ci.*,
         i.item_product_id,
         p.fld01 AS product_fld01,
         p.fld02 AS product_fld02,
         p.fld03 AS product_fld03,
         p.fldd01 AS product_fldd01
       FROM ${TABLE} ci
       LEFT JOIN "Items"    i ON ci.ckp_epc_id = i.item_id
       LEFT JOIN "Products" p ON i.item_product_id = p.product_id
       WHERE ci.${FK} = $1
       ORDER BY ci.${PK} ASC`,
      [chkId]
    );
    return NextResponse.json({ items: rows.rows, pkCol: PK, fkCol: FK });
  } catch (error: any) {
    console.error('Error fetching checklist_items:', error);
    return NextResponse.json({ error: 'Errore nel recupero checklist_items', detail: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: chkId } = await params;
    const body = await req.json();

    const allowed = ['ckp_epc_id', 'ckp_qta', 'ckp_qta_exp', 'ckp_qta_unexp', 'ckp_qta_missing'];
    const keys = allowed.filter(k => body[k] !== undefined);
    keys.push(FK);
    const values = [...keys.slice(0, -1).map(k => body[k]), chkId];

    const cols = keys.map(k => k).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const result = await query(
      `INSERT INTO ${TABLE} (${cols}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error inserting checklist_item:', error);
    return NextResponse.json({ error: 'Errore nella creazione', detail: error?.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const pkVal = body[PK];
    if (!pkVal) return NextResponse.json({ error: `${PK} mancante` }, { status: 400 });

    const allowed = ['ckp_epc_id', 'ckp_qta', 'ckp_qta_exp', 'ckp_qta_unexp', 'ckp_qta_missing'];
    const keys = allowed.filter(k => body[k] !== undefined);
    if (keys.length === 0) return NextResponse.json({ error: 'Nessun campo da aggiornare' }, { status: 400 });

    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const values = [pkVal, ...keys.map(k => body[k])];

    const result = await query(
      `UPDATE ${TABLE} SET ${setClause} WHERE ${PK} = $1 RETURNING *`,
      values
    );
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating checklist_item:', error);
    return NextResponse.json({ error: "Errore nell'aggiornamento", detail: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

    await query(`DELETE FROM ${TABLE} WHERE ${PK} = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting checklist_item:', error);
    return NextResponse.json({ error: 'Errore nella cancellazione', detail: error?.message }, { status: 500 });
  }
}
