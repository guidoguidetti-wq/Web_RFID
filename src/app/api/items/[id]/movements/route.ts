import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // item_id / mov_epc

    // Note: mov_dest_place and mov_dest_zone seem to be string IDs matching Places.place_id and Zones.zone_id
    // based on the data inspection ('WHS', 'TST').
    
    const sql = `
      SELECT 
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
      WHERE m.mov_epc = $1
      ORDER BY m.mov_timestamp DESC
    `;

    const result = await query(sql, [id]);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching movements:', error);
    return NextResponse.json({ error: 'Errore nel recupero movimenti' }, { status: 500 });
  }
}
