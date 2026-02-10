import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { isValidRFIDCode } from '@/lib/qrHelpers';

/**
 * GET /api/qr/check?code=0000001
 * Checks if RFID code exists in Items table and if it has an associated Person
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    // Validate RFID code format
    if (!isValidRFIDCode(code)) {
      return NextResponse.json(
        {
          error: 'Codice RFID non valido. Deve essere alfanumerico (4-100 caratteri)',
          exists: false,
          hasAssociation: false
        },
        { status: 400 }
      );
    }

    const sanitizedCode = code!.trim().toUpperCase();

    // Check if code exists in Items table
    const itemResult = await query(
      'SELECT * FROM "Items" WHERE item_id = $1',
      [sanitizedCode]
    );

    const itemExists = itemResult.rowCount! > 0;
    const item = itemExists ? itemResult.rows[0] : null;

    // Check if code has an associated person
    const personResult = await query(
      'SELECT * FROM "People" WHERE rfid_tag_id = $1',
      [sanitizedCode]
    );

    const hasAssociation = personResult.rowCount! > 0;
    const person = hasAssociation ? personResult.rows[0] : null;

    return NextResponse.json({
      exists: itemExists,
      hasAssociation,
      item,
      person,
      code: sanitizedCode
    });
  } catch (error) {
    console.error('Error checking QR code:', error);
    return NextResponse.json(
      { error: 'Errore nella verifica del codice QR' },
      { status: 500 }
    );
  }
}
