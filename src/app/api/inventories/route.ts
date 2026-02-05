import { NextRequest, NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    let sql = `
      SELECT 
        i.inv_id,
        i.inv_name,
        i.inv_start_date,
        i.inv_place_id,
        p.place_name,
        i.inv_state,
        i.inv_note,
        i.inv_chk_id,
        i.inv_last,
        i.inv_last_place,
        i.inv_last_zones,
        i.inv_det_place,
        i.inv_det_zone,
        i.inv_mis_place,
        i.inv_mis_zone,
        (SELECT COUNT(*)::int FROM "inventory_items" ii WHERE ii.int_inv_id = i.inv_id) as item_count
      FROM "inventories" i
      LEFT JOIN "Places" p ON i.inv_place_id = p.place_id
    `;
    
    const params = [];
    if (id) {
      sql += ' WHERE i.inv_id = $1';
      params.push(id);
    }

    sql += ' ORDER BY i.inv_id DESC';
    
    const result = await query(sql, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching inventories:', error);
    return NextResponse.json({ error: 'Errore nel recupero inventari' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { inv_name, inv_start_date, inv_place_id, inv_state, inv_note, inv_chk_id, inv_last, inv_last_place, inv_last_zones, inv_det_place, inv_det_zone, inv_mis_place, inv_mis_zone } = body;

    // Convert empty strings to NULL for foreign key fields and integer fields
    inv_place_id = inv_place_id || null;
    inv_chk_id = inv_chk_id || null;
    inv_last_place = inv_last_place || null;
    inv_last_zones = inv_last_zones || null;
    inv_det_place = inv_det_place || null;
    inv_det_zone = inv_det_zone || null;
    inv_mis_place = inv_mis_place || null;
    inv_mis_zone = inv_mis_zone || null;

    const sql = `
      INSERT INTO "inventories"
      (inv_name, inv_start_date, inv_place_id, inv_state, inv_note, inv_chk_id, inv_last, inv_last_place, inv_last_zones, inv_det_place, inv_det_zone, inv_mis_place, inv_mis_zone)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const result = await query(sql, [inv_name, inv_start_date, inv_place_id, inv_state, inv_note, inv_chk_id, inv_last, inv_last_place, inv_last_zones, inv_det_place, inv_det_zone, inv_mis_place, inv_mis_zone]);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating inventory:', error);
    return NextResponse.json({ error: 'Errore nella creazione inventario' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { inv_id, ...updates } = body;

    if (!inv_id) {
      return NextResponse.json({ error: 'ID Inventario mancante' }, { status: 400 });
    }

    // Convert empty strings to NULL for foreign key fields and integer fields
    const fieldsToConvert = ['inv_place_id', 'inv_chk_id', 'inv_last_place', 'inv_last_zones', 'inv_det_place', 'inv_det_zone', 'inv_mis_place', 'inv_mis_zone'];
    fieldsToConvert.forEach(field => {
      if (field in updates && updates[field] === '') {
        updates[field] = null;
      }
    });

    const validColumns = ['inv_name', 'inv_start_date', 'inv_place_id', 'inv_state', 'inv_note', 'inv_chk_id', 'inv_last', 'inv_last_place', 'inv_last_zones', 'inv_det_place', 'inv_det_zone', 'inv_mis_place', 'inv_mis_zone'];
    const keys = Object.keys(updates).filter(k => validColumns.includes(k));

    if (keys.length === 0) {
      return NextResponse.json({ error: 'Nessun dato da aggiornare' }, { status: 400 });
    }

    const setClause = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
    const values = [inv_id, ...keys.map(k => updates[k])];

    const sql = `UPDATE "inventories" SET ${setClause} WHERE inv_id = $1 RETURNING *`;
    
    const result = await query(sql, values);

    if (result.rowCount === 0) {
       return NextResponse.json({ error: 'Inventario non trovato' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json({ error: 'Errore nell\'aggiornamento inventario' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete related items first
      await client.query('DELETE FROM "inventory_items" WHERE int_inv_id = $1', [id]);
      
      // Delete inventory
      const res = await client.query('DELETE FROM "inventories" WHERE inv_id = $1', [id]);
      
      if (res.rowCount === 0) {
        throw new Error('Inventario non trovato');
      }

      await client.query('COMMIT');
      return NextResponse.json({ success: true });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting inventory:', error);
    return NextResponse.json({ error: 'Errore nella cancellazione inventario' }, { status: 500 });
  }
}
