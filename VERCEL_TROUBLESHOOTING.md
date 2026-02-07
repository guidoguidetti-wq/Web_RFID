# 🔧 Troubleshooting Errore 500 su Vercel

## ❌ Problema: Errore 500 al Login

Se ricevi un errore 500 dopo aver fatto il deploy su Vercel, segui questi passaggi:

## 🔍 Passo 1: Verificare i Log di Vercel

1. Vai su **https://vercel.com/dashboard**
2. Clicca sul tuo progetto **"Web_RFID"**
3. Vai su **"Deployments"**
4. Clicca sull'ultimo deployment
5. Vai su **"Functions"** → Clicca sulla funzione che dà errore (es. `/api/auth/login`)
6. Guarda i **Logs** per vedere l'errore esatto

### Errori Comuni nei Log:

#### A) "DATABASE_URL is not defined"
**Soluzione**: La variabile d'ambiente non è configurata

1. Vai su **Settings** → **Environment Variables**
2. Verifica che `DATABASE_URL` sia presente
3. Se manca, aggiungila:
   ```
   DATABASE_URL=postgresql://neondb_owner:npg_BCdrof7vEPy1@ep-plain-frog-agqkflif-pooler.c-2.eu-central-1.aws.neon.tech:5432/rfid_db?sslmode=require
   ```
4. **IMPORTANTE**: Dopo aver aggiunto/modificato, vai su **Deployments** → **...** → **Redeploy**

#### B) "Connection timeout" o "ENOTFOUND"
**Soluzione**: Il database non è raggiungibile

1. Verifica che il database Neon sia attivo:
   - Vai su https://console.neon.tech
   - Controlla lo stato del database

2. Verifica che l'URL sia corretto (copia-incolla esatto):
   ```
   postgresql://neondb_owner:npg_BCdrof7vEPy1@ep-plain-frog-agqkflif-pooler.c-2.eu-central-1.aws.neon.tech:5432/rfid_db?sslmode=require
   ```

3. Verifica che Neon permetta connessioni dall'esterno:
   - Di default Neon permette connessioni da qualsiasi IP
   - Controlla nella console Neon se ci sono restrizioni IP

#### C) "relation \"users\" does not exist"
**Soluzione**: Le tabelle non sono state create

1. Vai su https://console.neon.tech
2. Apri la **SQL Editor** del tuo database
3. Esegui il contenuto di `database_schema.sql`:
   ```sql
   -- Copia e incolla tutto il contenuto del file database_schema.sql
   ```
4. Esegui anche `sample_data.sql` per avere dati di test

#### D) "SSL connection required"
**Soluzione**: Problema SSL

Ho già configurato SSL nel codice. Se vedi questo errore:
1. Verifica che l'URL contenga `?sslmode=require`
2. Verifica che il database Neon abbia SSL abilitato (è di default)

## 🔐 Passo 2: Verificare Variabili d'Ambiente

1. Vai su **Vercel Dashboard** → **Settings** → **Environment Variables**
2. Verifica che `DATABASE_URL` sia presente per:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

3. Clicca su **Edit** accanto a `DATABASE_URL`
4. Verifica il valore (deve essere identico a questo):
   ```
   postgresql://neondb_owner:npg_BCdrof7vEPy1@ep-plain-frog-agqkflif-pooler.c-2.eu-central-1.aws.neon.tech:5432/rfid_db?sslmode=require
   ```

5. Se modifichi qualcosa, **DEVI fare Redeploy**:
   - Vai su **Deployments**
   - Clicca **...** sull'ultimo deployment
   - Clicca **Redeploy**

## 🧪 Passo 3: Test Database Diretto

Testa la connessione al database dal tuo PC:

```bash
# Installa psql se non ce l'hai
# Windows: scaricare da https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: apt-get install postgresql-client

# Test connessione
psql "postgresql://neondb_owner:npg_BCdrof7vEPy1@ep-plain-frog-agqkflif-pooler.c-2.eu-central-1.aws.neon.tech:5432/rfid_db?sslmode=require"

# Se connesso, verifica tabelle
\dt

# Verifica utenti
SELECT * FROM users;
```

Se la connessione funziona dal tuo PC ma non da Vercel, potrebbe essere un problema di:
- Timeout Vercel (risolto con le configurazioni che ho aggiunto)
- Firewall database (controlla Neon console)

## 🚀 Passo 4: Force Redeploy

Dopo aver fatto le modifiche al codice che ho fatto:

1. **Fai push delle modifiche**:
   ```bash
   cd "C:\_RFID\Desktop_RFID"
   git add .
   git commit -m "fix: Improve database configuration for Vercel"
   git push
   ```

2. Vercel farà automaticamente il redeploy

3. Aspetta che il build finisca (~2 minuti)

4. Riprova il login

## 📊 Passo 5: Controllare le Function Logs

Per vedere i log in real-time:

1. Vai su **Vercel Dashboard**
2. Clicca sul progetto
3. Vai su **Functions**
4. Scegli la function che dà errore
5. I log ora mostreranno dettagli più precisi (ho aggiunto più logging)

Cerca questi messaggi:
- ✅ "Database connected" = connessione OK
- ❌ "DATABASE_URL not configured" = variabile mancante
- ❌ "Connection timeout" = database non raggiungibile

## 🔧 Passo 6: Credenziali Test

Dopo aver eseguito `sample_data.sql`, prova a fare login con:

**Username**: `admin`
**Password**: `password123`

Se questi non funzionano, le tabelle non sono state popolate correttamente.

## 💡 Soluzione Rapida

Se hai fretta, fai questo:

1. **Verifica DATABASE_URL su Vercel**:
   - Settings → Environment Variables
   - Deve essere identico a quello che ho scritto sopra

2. **Verifica database su Neon**:
   - Vai su console.neon.tech
   - Esegui: `SELECT * FROM users LIMIT 1;`
   - Se dà errore, esegui `database_schema.sql` e `sample_data.sql`

3. **Redeploy**:
   - Deployments → ... → Redeploy

4. **Riprova il login**

## 🆘 Se Ancora Non Funziona

Manda questi dettagli:

1. **Screenshot dei log** da Vercel Functions
2. **Risultato del test** `psql` dal tuo PC
3. **Screenshot** Environment Variables da Vercel Settings
4. **Errore esatto** dalla console browser (F12 → Console)

## ✅ Checklist Completa

- [ ] DATABASE_URL configurato su Vercel
- [ ] DATABASE_URL include `?sslmode=require`
- [ ] Database Neon attivo e accessibile
- [ ] Tabelle create (eseguito `database_schema.sql`)
- [ ] Dati inseriti (eseguito `sample_data.sql`)
- [ ] Redeploy fatto dopo modifiche
- [ ] Timeout sufficienti (configurati nel codice)
- [ ] Log controllati su Vercel
- [ ] Test login con admin/password123

---

**Tempo stimato risoluzione**: 5-10 minuti

La maggior parte dei problemi è dovuta a DATABASE_URL non configurato correttamente!
