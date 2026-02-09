import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    console.log('📤 Upload request received');
    const formData = await req.formData();
    console.log('✓ FormData parsed');

    const file = formData.get('image') as File;
    console.log('File:', file ? `${file.name} (${file.size} bytes, ${file.type})` : 'null');

    if (!file) {
      console.error('❌ No file in formData');
      return NextResponse.json(
        { error: 'Nessun file caricato' },
        { status: 400 }
      );
    }

    // Validazione tipo file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato non valido. Usa JPG, PNG o WebP' },
        { status: 400 }
      );
    }

    // Validazione dimensione (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File troppo grande. Massimo 5MB' },
        { status: 400 }
      );
    }

    // Generazione nome file sicuro con UUID
    const fileExt = path.extname(file.name);
    const sanitizedName = crypto.randomUUID() + fileExt;
    console.log('Generated filename:', sanitizedName);

    // Path sicuro per evitare directory traversal
    const uploadPath = path.join(process.cwd(), 'public', 'people', sanitizedName);
    console.log('Upload path:', uploadPath);

    // Verifica che il path sia all'interno della directory consentita
    const peopleDir = path.join(process.cwd(), 'public', 'people');
    if (!uploadPath.startsWith(peopleDir)) {
      console.error('❌ Invalid path');
      return NextResponse.json(
        { error: 'Path non valido' },
        { status: 400 }
      );
    }

    // Conversione file in buffer e salvataggio
    console.log('Converting to buffer...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log('Buffer size:', buffer.length);

    console.log('Writing file...');
    await writeFile(uploadPath, buffer);
    console.log('✓ File written successfully');

    // Ritorna path relativo (senza /public)
    return NextResponse.json({
      imagePath: `people/${sanitizedName}`,
      message: 'Immagine caricata con successo'
    });
  } catch (error) {
    console.error('Errore upload immagine:', error);
    return NextResponse.json(
      { error: 'Errore durante il caricamento dell\'immagine' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imagePath = searchParams.get('path');

    if (!imagePath) {
      return NextResponse.json(
        { error: 'Path immagine mancante' },
        { status: 400 }
      );
    }

    // Validazione path per sicurezza
    const fullPath = path.join(process.cwd(), 'public', imagePath);
    const peopleDir = path.join(process.cwd(), 'public', 'people');

    if (!fullPath.startsWith(peopleDir)) {
      return NextResponse.json(
        { error: 'Path non valido' },
        { status: 400 }
      );
    }

    // Cancellazione file (ignora se non esiste)
    await unlink(fullPath).catch(() => {});

    return NextResponse.json({
      message: 'Immagine cancellata con successo'
    });
  } catch (error) {
    console.error('Errore cancellazione immagine:', error);
    return NextResponse.json(
      { error: 'Errore durante la cancellazione dell\'immagine' },
      { status: 500 }
    );
  }
}
