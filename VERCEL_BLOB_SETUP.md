# Configurazione Vercel Blob Storage per Upload Immagini

## Prerequisiti
- Progetto deployato su Vercel
- Package `@vercel/blob` installato (✓ già fatto)

## Passi per la configurazione

### 1. Crea un Blob Store su Vercel

1. Vai alla dashboard di Vercel: https://vercel.com/dashboard
2. Seleziona il tuo progetto
3. Vai su **Storage** nella barra laterale
4. Clicca su **Create Database**
5. Seleziona **Blob**
6. Clicca su **Create**

### 2. Ottieni il Token

Dopo aver creato il Blob Store:

1. Vercel genererà automaticamente un token `BLOB_READ_WRITE_TOKEN`
2. Il token sarà aggiunto automaticamente alle **Environment Variables** del progetto

### 3. Verifica le Environment Variables

1. Vai su **Settings** → **Environment Variables**
2. Verifica che esista `BLOB_READ_WRITE_TOKEN`
3. Se non esiste, copialo dalla pagina Storage e aggiungilo manualmente

### 4. Deploy

Una volta configurato il token, fai un nuovo deploy:

```bash
git add .
git commit -m "Add Vercel Blob support for image uploads"
git push
```

Vercel farà automaticamente il deploy con le nuove environment variables.

## Come Funziona

### Upload
- Le immagini vengono caricate su Vercel Blob Storage
- Ogni immagine riceve un URL pubblico permanente
- Esempio: `https://xxxxxxx.public.blob.vercel-storage.com/people/1234567890-abc.jpg`

### Storage
- L'URL viene salvato nel database nel campo `image`
- Non c'è bisogno di salvare file nella cartella `public`
- Le immagini sono accessibili globalmente via CDN

### Delete
- Quando elimini una persona, l'immagine viene automaticamente rimossa da Blob Storage

## Limiti (Piano Gratuito Vercel)

- **Bandwidth**: 100 GB/mese
- **Storage**: 1 GB totale
- **Richieste**: Illimitate

Per progetti con molte immagini, considera di passare al piano Pro.

## Testing Locale (Opzionale)

Per testare in locale:

1. Copia il token da Vercel Dashboard
2. Aggiungi al file `.env.local`:
   ```
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxxxx
   ```
3. Riavvia il server di sviluppo

**IMPORTANTE**: Non committare mai il token su Git! È già nel `.gitignore`.

## Risoluzione Problemi

### Errore 401 Unauthorized
- Il token non è configurato o non è valido
- Verifica che `BLOB_READ_WRITE_TOKEN` sia presente nelle Environment Variables

### Errore 403 Forbidden
- Il token non ha permessi di scrittura
- Rigenera il token dalla dashboard Vercel

### Upload funziona ma immagine non si vede
- Verifica che l'URL nel database sia completo (inizia con `https://`)
- Controlla i CORS settings (Vercel Blob li gestisce automaticamente)

## Migrazione da Filesystem Locale

Se hai già immagini salvate in `public/people`:

1. Le vecchie immagini continueranno a funzionare
2. Le nuove immagini verranno salvate su Vercel Blob
3. Puoi migrare manualmente le vecchie immagini se necessario

## Risorse

- Documentazione Vercel Blob: https://vercel.com/docs/storage/vercel-blob
- Dashboard Storage: https://vercel.com/dashboard/stores
