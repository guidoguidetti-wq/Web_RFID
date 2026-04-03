import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const usrId = searchParams.get('usr_id');
    if (!usrId) {
      return NextResponse.json({ error: 'usr_id richiesto' }, { status: 400 });
    }
    const result = await query(
      'SELECT * FROM user_functions WHERE usr_f_usr_id = $1 ORDER BY usr_f_fun_id ASC',
      [usrId]
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Errore nel recupero funzioni utente' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { usr_f_usr_id, usr_f_fun_id, usr_f_prog, usr_f_label, usr_f_enabled } = await req.json();
    const result = await query(
      `UPDATE user_functions
       SET usr_f_prog = $1, usr_f_label = $2, usr_f_enabled = $3
       WHERE usr_f_usr_id = $4 AND usr_f_fun_id = $5
       RETURNING *`,
      [usr_f_prog, usr_f_label, usr_f_enabled, usr_f_usr_id, usr_f_fun_id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: "Errore nell'aggiornamento funzione utente" }, { status: 500 });
  }
}
