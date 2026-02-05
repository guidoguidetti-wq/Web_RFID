import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const result = await query(
      'SELECT * FROM users WHERE usr_name = $1 AND usr_pwd = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      // In un'app reale qui useresti un JWT o una sessione
      return NextResponse.json({ 
        success: true, 
        user: { id: user.usr_id, name: user.usr_name, place: user.usr_def_place } 
      });
    } else {
      return NextResponse.json({ success: false, message: 'Credenziali non valide' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'Errore interno del server' }, { status: 500 });
  }
}
