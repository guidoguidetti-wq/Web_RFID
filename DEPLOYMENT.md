# 🚀 Guida Deploy su Vercel

Questa guida ti aiuterà a pubblicare l'applicazione RFID Management System su Vercel.

## Prerequisiti

- Account GitHub (già configurato ✅)
- Repository pubblicato su GitHub (già fatto ✅)
- Account Vercel (gratuito) - da creare se non lo hai

## 📝 Passo 1: Creare Account Vercel

1. Vai su [https://vercel.com](https://vercel.com)
2. Clicca su "Sign Up"
3. Scegli "Continue with GitHub"
4. Autorizza Vercel ad accedere al tuo account GitHub

## 🔗 Passo 2: Importare il Repository

1. Dalla dashboard Vercel, clicca su **"Add New..."** → **"Project"**
2. Vercel rileverà automaticamente i tuoi repository GitHub
3. Trova **"Web_RFID"** nella lista
4. Clicca su **"Import"**

## ⚙️ Passo 3: Configurare il Progetto

Vercel rileverà automaticamente che è un progetto Next.js e configurerà:
- **Framework Preset**: Next.js ✅
- **Build Command**: `next build` ✅
- **Output Directory**: `.next` ✅
- **Install Command**: `npm install` ✅

**NON modificare queste impostazioni - sono corrette!**

## 🔐 Passo 4: Configurare Variabili d'Ambiente

**IMPORTANTE**: Devi aggiungere le credenziali del database!

1. Nella sezione **"Environment Variables"**, aggiungi:

   **Nome variabile**: `DATABASE_URL`

   **Valore**:
   ```
   postgresql://neondb_owner:npg_BCdrof7vEPy1@ep-plain-frog-agqkflif-pooler.c-2.eu-central-1.aws.neon.tech:5432/rfid_db?sslmode=require
   ```

2. Assicurati che sia selezionato:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

3. Clicca **"Add"**

## 🚀 Passo 5: Deploy!

1. Clicca su **"Deploy"**
2. Vercel inizierà il build del progetto
3. Attendi qualche minuto (prima build ~2-3 minuti)
4. Quando vedi "Congratulations!" 🎉 il deploy è completato!

## 🌐 Accedere all'Applicazione

Dopo il deploy, avrai:
- **URL Production**: `https://web-rfid.vercel.app` (o simile)
- **URL Preview**: per ogni branch/commit
- **Dashboard Vercel**: per monitorare e gestire il progetto

### Domini Custom (opzionale)

Se vuoi un dominio personalizzato:
1. Vai su "Settings" → "Domains"
2. Aggiungi il tuo dominio
3. Configura i DNS secondo le istruzioni

## 🔄 Deploy Automatici

Ogni volta che fai push su GitHub:
- ✅ Push su `main` → deploy automatico in **production**
- ✅ Push su altri branch → deploy di **preview**
- ✅ Pull Request → anteprima automatica

## 🐛 Troubleshooting

### Build Failed

**Problema**: Errore durante il build
- Controlla i log nella dashboard Vercel
- Verifica che `DATABASE_URL` sia configurato correttamente
- Assicurati che tutte le dipendenze siano nel `package.json`

### Database Connection Error

**Problema**: Errore di connessione al database
- Verifica che la variabile `DATABASE_URL` sia corretta
- Controlla che il database Neon sia attivo
- Verifica le impostazioni SSL del database

### Page Not Found

**Problema**: 404 su alcune pagine
- Vercel supporta tutte le route Next.js automaticamente
- Se hai route dinamiche, assicurati che siano nella cartella corretta

## 📊 Monitoraggio

Dalla dashboard Vercel puoi vedere:
- **Analytics**: Visite, performance
- **Logs**: Log real-time dell'applicazione
- **Deployments**: Storico di tutti i deploy
- **Settings**: Configurazione progetto

## 🔒 Sicurezza

- ✅ Le variabili d'ambiente sono criptate
- ✅ Mai esporre `DATABASE_URL` nel codice
- ✅ Usa sempre HTTPS (Vercel fornisce SSL gratis)
- ✅ Le variabili non sono visibili nei log pubblici

## 💡 Comandi Utili

### Forzare Redeploy
```bash
git commit --allow-empty -m "Force redeploy" && git push
```

### Deploy da CLI
```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy in production
vercel --prod
```

## 🆘 Supporto

- **Documentazione Vercel**: [https://vercel.com/docs](https://vercel.com/docs)
- **Next.js su Vercel**: [https://vercel.com/docs/frameworks/nextjs](https://vercel.com/docs/frameworks/nextjs)
- **Community Discord**: [https://vercel.com/discord](https://vercel.com/discord)

---

## 📋 Checklist Deploy

Prima di fare il deploy, verifica:

- [x] Repository su GitHub
- [x] `.env.local` NON nel repository (in .gitignore)
- [x] `package.json` con script corretti
- [x] Database PostgreSQL attivo e accessibile
- [ ] Account Vercel creato
- [ ] Variabile `DATABASE_URL` configurata su Vercel
- [ ] Deploy completato con successo
- [ ] Applicazione accessibile via URL Vercel
- [ ] Test login e funzionalità principali

---

**Tempo stimato**: 10-15 minuti per il primo deploy

**Costo**: GRATIS con piano Hobby (più che sufficiente per questo progetto)

Buon deploy! 🚀
