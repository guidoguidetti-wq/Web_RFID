import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT * FROM users ORDER BY usr_id ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Errore nel recupero utenti' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { usr_name, usr_pwd, usr_def_place, usr_role } = await req.json();
    const result = await query(
      'INSERT INTO users (usr_name, usr_pwd, usr_def_place, usr_role) VALUES ($1, $2, $3, $4) RETURNING *',
      [usr_name, usr_pwd, usr_def_place, usr_role]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Errore nella creazione utente' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { usr_id, usr_name, usr_pwd, usr_def_place, usr_role } = await req.json();
    const result = await query(
      'UPDATE users SET usr_name = $1, usr_pwd = $2, usr_def_place = $3, usr_role = $4 WHERE usr_id = $5 RETURNING *',
      [usr_name, usr_pwd, usr_def_place, usr_role, usr_id]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Errore nell\'aggiornamento utente' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    await query('DELETE FROM users WHERE usr_id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Errore nella cancellazione utente' }, { status: 500 });
  }
}
