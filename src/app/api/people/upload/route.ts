import { NextRequest, NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';

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

    // Generazione nome file unico
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const fileName = `people/${timestamp}-${randomString}.${extension}`;

    console.log('Uploading to Vercel Blob:', fileName);

    // Upload a Vercel Blob
    const blob = await put(fileName, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    console.log('✓ File uploaded successfully:', blob.url);

    // Ritorna URL pubblico
    return NextResponse.json({
      imagePath: blob.url,
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
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL immagine mancante' },
        { status: 400 }
      );
    }

    // Verifica che sia un URL Vercel Blob valido
    if (!imageUrl.includes('blob.vercel-storage.com')) {
      return NextResponse.json(
        { error: 'URL non valido' },
        { status: 400 }
      );
    }

    console.log('Deleting from Vercel Blob:', imageUrl);

    // Cancellazione da Vercel Blob
    await del(imageUrl);

    console.log('✓ File deleted successfully');

    return NextResponse.json({
      message: 'Immagine cancellata con successo'
    });
  } catch (error) {
    console.error('Errore cancellazione immagine:', error);
    // Non restituire errore se il file non esiste (già cancellato)
    return NextResponse.json({
      message: 'Immagine cancellata o non trovata'
    });
  }
}
