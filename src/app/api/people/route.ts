import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build filter conditions
    const filters: { [key: string]: string } = {};
    const validColumns = ['name', 'role', 'company', 'department'];

    validColumns.forEach(col => {
      const filterValue = searchParams.get(`filter_${col}`);
      if (filterValue) {
        filters[col] = filterValue;
      }
    });

    // Build WHERE clause
    const whereClauses: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    Object.keys(filters).forEach(col => {
      whereClauses.push(`"${col}"::text ILIKE $${paramIndex}`);
      queryParams.push(`%${filters[col]}%`);
      paramIndex++;
    });

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Get total count with filters
    const countResult = await query(
      `SELECT COUNT(*)::int as total FROM "People" ${whereSQL}`,
      queryParams
    );
    const total = countResult.rows[0].total;

    // Get paginated people with filters
    queryParams.push(limit, offset);
    const result = await query(
      `SELECT * FROM "People" ${whereSQL} ORDER BY people_id ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    );

    return NextResponse.json({
      people: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching people:', error);
    return NextResponse.json({ error: 'Errore nel recupero persone' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, role, company, department, image } = body;

    // Validazione campo obbligatorio
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nome richiesto (minimo 2 caratteri)' },
        { status: 400 }
      );
    }

    // Sanitizzazione e validazione lunghezza
    const sanitizedData = {
      name: name.trim().substring(0, 255),
      role: role?.trim().substring(0, 100) || null,
      company: company?.trim().substring(0, 255) || null,
      department: department?.trim().substring(0, 255) || null,
      image: image?.trim().substring(0, 500) || null
    };

    const result = await query(
      `INSERT INTO "People" (name, role, company, department, image)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [sanitizedData.name, sanitizedData.role, sanitizedData.company, sanitizedData.department, sanitizedData.image]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating person:', error);
    return NextResponse.json({ error: 'Errore nella creazione persona' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { people_id, name, role, company, department, image } = body;

    if (!people_id) {
      return NextResponse.json({ error: 'ID persona mancante' }, { status: 400 });
    }

    // Validazione campo obbligatorio
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nome richiesto (minimo 2 caratteri)' },
        { status: 400 }
      );
    }

    // Sanitizzazione e validazione lunghezza
    const sanitizedData = {
      name: name.trim().substring(0, 255),
      role: role?.trim().substring(0, 100) || null,
      company: company?.trim().substring(0, 255) || null,
      department: department?.trim().substring(0, 255) || null,
      image: image?.trim().substring(0, 500) || null
    };

    const result = await query(
      `UPDATE "People"
       SET name = $1, role = $2, company = $3, department = $4, image = $5, updated_at = NOW()
       WHERE people_id = $6
       RETURNING *`,
      [sanitizedData.name, sanitizedData.role, sanitizedData.company, sanitizedData.department, sanitizedData.image, people_id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Persona non trovata' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating person:', error);
    return NextResponse.json({ error: 'Errore nell\'aggiornamento persona' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
    }

    // Recupera i dati della persona per ottenere il path dell'immagine
    const personResult = await query(
      'SELECT image FROM "People" WHERE people_id = $1',
      [id]
    );

    if (personResult.rowCount === 0) {
      return NextResponse.json({ error: 'Persona non trovata' }, { status: 404 });
    }

    // Cancella il record dal database
    await query('DELETE FROM "People" WHERE people_id = $1', [id]);

    // Rimuovi il file immagine se esiste
    const imagePath = personResult.rows[0]?.image;
    if (imagePath) {
      const fullPath = path.join(process.cwd(), 'public', imagePath);
      await unlink(fullPath).catch((err) => {
        console.warn('Impossibile cancellare immagine:', err.message);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting person:', error);
    return NextResponse.json({ error: 'Errore nella cancellazione persona' }, { status: 500 });
  }
}
