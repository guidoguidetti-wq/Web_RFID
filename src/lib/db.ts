import { Pool } from 'pg';

// Configurazione ottimizzata per Vercel Serverless Functions
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? {
    rejectUnauthorized: false
  } : false,
  max: 10, // Limite massimo connessioni
  idleTimeoutMillis: 30000, // Timeout inattività 30s
  connectionTimeoutMillis: 10000, // Timeout connessione 10s
});

// Log per debug (solo in development)
if (process.env.NODE_ENV === 'development') {
  pool.on('connect', () => {
    console.log('Database connected');
  });

  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
  });
}

export const query = (text: string, params?: any[]) => pool.query(text, params);
