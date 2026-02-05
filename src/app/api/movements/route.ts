import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const sql = `
      SELECT 
        m.mov_epc,
        p.place_name as "Place",
        z.zone_name as "Zone",
        m.mov_timestamp,
        m.mov_user,
        m.mov_ref,
        m.mov_readscount as mov_readcount, 
        m.mov_rssiavg
      FROM "Movements" m
      LEFT JOIN "Places" p ON m.mov_dest_place = p.place_id
      LEFT JOIN "Zones" z ON m.mov_dest_zone = z.zone_id
      ORDER BY m.mov_timestamp DESC
      LIMIT 1000
    `;

    const result = await query(sql);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching all movements:', error);
    return NextResponse.json({ error: 'Errore nel recupero movimenti' }, { status: 500 });
  }
}
