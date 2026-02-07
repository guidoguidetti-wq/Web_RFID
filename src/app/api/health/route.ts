import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    // Test database connection
    const result = await pool.query('SELECT NOW() as time, version() as version');

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: result.rows[0].time,
      version: result.rows[0].version,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error: any) {
    console.error('Health check failed:', error);

    return NextResponse.json({
      status: 'error',
      database: 'disconnected',
      error: {
        message: error.message,
        code: error.code,
        detail: error.detail
      },
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}
