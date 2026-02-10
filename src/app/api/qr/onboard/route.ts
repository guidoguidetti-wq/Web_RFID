import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { isValidRFIDCode, isValidPersonName, isValidOptionalField } from '@/lib/qrHelpers';

/**
 * POST /api/qr/onboard
 * Creates a new person and associates them with an RFID tag
 * Uses atomic transaction to ensure data consistency
 */
export async function POST(req: NextRequest) {
  const client = await pool.connect();

  try {
    const body = await req.json();
    const { code, name, role, company, department, image } = body;

    // Validate required fields
    if (!isValidRFIDCode(code)) {
      return NextResponse.json(
        { error: 'Codice RFID non valido. Deve essere alfanumerico (4-100 caratteri)' },
        { status: 400 }
      );
    }

    if (!isValidPersonName(name)) {
      return NextResponse.json(
        { error: 'Nome richiesto (minimo 2 caratteri, massimo 255)' },
        { status: 400 }
      );
    }

    // Validate optional fields
    if (!isValidOptionalField(role, 100)) {
      return NextResponse.json(
        { error: 'Ruolo troppo lungo (massimo 100 caratteri)' },
        { status: 400 }
      );
    }

    if (!isValidOptionalField(company, 255)) {
      return NextResponse.json(
        { error: 'Azienda troppo lungo (massimo 255 caratteri)' },
        { status: 400 }
      );
    }

    if (!isValidOptionalField(department, 255)) {
      return NextResponse.json(
        { error: 'Dipartimento troppo lungo (massimo 255 caratteri)' },
        { status: 400 }
      );
    }

    if (!isValidOptionalField(image, 500)) {
      return NextResponse.json(
        { error: 'URL immagine troppo lungo (massimo 500 caratteri)' },
        { status: 400 }
      );
    }

    const sanitizedCode = code.trim().toUpperCase();

    // Sanitize data
    const sanitizedData = {
      name: name.trim().substring(0, 255),
      role: role?.trim().substring(0, 100) || null,
      company: company?.trim().substring(0, 255) || null,
      department: department?.trim().substring(0, 255) || null,
      image: image?.trim().substring(0, 500) || null
    };

    // Begin transaction
    await client.query('BEGIN');

    try {
      // Step 1: Ensure Item exists (create if not exists)
      await client.query(
        `INSERT INTO "Items" (item_id, date_creation)
         VALUES ($1, NOW())
         ON CONFLICT (item_id) DO NOTHING`,
        [sanitizedCode]
      );

      // Step 2: Check if RFID tag is already associated with a person
      const existingAssociation = await client.query(
        'SELECT people_id, name FROM "People" WHERE rfid_tag_id = $1',
        [sanitizedCode]
      );

      if (existingAssociation.rowCount! > 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          {
            error: `Questo badge è già associato a: ${existingAssociation.rows[0].name}`,
            existingPerson: existingAssociation.rows[0]
          },
          { status: 409 }
        );
      }

      // Step 3: Create person with RFID association
      const personResult = await client.query(
        `INSERT INTO "People" (name, role, company, department, image, rfid_tag_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          sanitizedData.name,
          sanitizedData.role,
          sanitizedData.company,
          sanitizedData.department,
          sanitizedData.image,
          sanitizedCode
        ]
      );

      // Commit transaction
      await client.query('COMMIT');

      const createdPerson = personResult.rows[0];

      console.log(`✓ Person created and associated with RFID tag: ${sanitizedCode}`);

      return NextResponse.json(
        {
          success: true,
          person: createdPerson,
          message: 'Persona registrata con successo'
        },
        { status: 201 }
      );
    } catch (txError) {
      // Rollback on any error
      await client.query('ROLLBACK');
      throw txError;
    }
  } catch (error) {
    console.error('Error during onboarding:', error);
    return NextResponse.json(
      { error: 'Errore durante la registrazione della persona' },
      { status: 500 }
    );
  } finally {
    // Release client back to pool
    client.release();
  }
}
