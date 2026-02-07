import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    console.log('Login attempt - checking database connection...');

    const { username, password } = await req.json();
    console.log('Login attempt for username:', username);

    // Test database connection
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not configured!');
      return NextResponse.json({
        success: false,
        message: 'Database non configurato'
      }, { status: 500 });
    }

    const result = await query(
      'SELECT * FROM users WHERE usr_name = $1 AND usr_pwd = $2',
      [username, password]
    );

    console.log('Query executed, rows found:', result.rows.length);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('Login successful for user:', user.usr_name);
      // In un'app reale qui useresti un JWT o una sessione
      return NextResponse.json({
        success: true,
        user: { id: user.usr_id, name: user.usr_name, place: user.usr_def_place }
      });
    } else {
      console.log('Invalid credentials for username:', username);
      return NextResponse.json({ success: false, message: 'Credenziali non valide' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Login error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    return NextResponse.json({
      success: false,
      message: 'Errore interno del server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
