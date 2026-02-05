# RFID Management System

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/guidoguidetti-wq/Web_RFID)

Sistema web di gestione inventario RFID sviluppato con Next.js e PostgreSQL.

## 🚀 Caratteristiche

- **Gestione Prodotti**: Creazione e gestione prodotti con campi dinamici
- **Gestione Items**: Tracciamento items RFID individuali
- **Movimenti**: Storico completo dei movimenti items
- **Inventari**: Sistema completo di inventario con rilevamento expected/unexpected/lost
- **Paginazione Server-side**: Performance ottimizzate con paginazione e filtri lato server
- **Filtri Avanzati**: Filtri real-time con debounce su tutte le tabelle
- **UI Responsive**: Design moderno e responsivo con Tailwind CSS

## 🛠️ Tecnologie

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **Icons**: Lucide React

## 📦 Installazione

1. **Clona il repository**
   ```bash
   git clone https://github.com/guidoguidetti-wq/Web_RFID.git
   cd Web_RFID
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Configura le variabili d'ambiente**

   Crea un file `.env.local` nella root del progetto:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
   ```

4. **Crea il database**

   Esegui lo script SQL per creare le tabelle:
   ```bash
   psql $DATABASE_URL -f database_schema.sql
   ```

5. **Inserisci i dati di esempio (opzionale)**
   ```bash
   psql $DATABASE_URL -f sample_data.sql
   ```

6. **Avvia il server di sviluppo**
   ```bash
   npm run dev
   ```

7. Apri [http://localhost:3000](http://localhost:3000) nel browser

## 🌐 Deploy su Vercel

Per pubblicare l'applicazione su Vercel:

1. **Deploy con un click** (più semplice):

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/guidoguidetti-wq/Web_RFID)

   Clicca il pulsante sopra e segui le istruzioni

2. **Deploy manuale**:

   Segui la guida completa in [DEPLOYMENT.md](./DEPLOYMENT.md)

⚠️ **IMPORTANTE**: Ricorda di configurare la variabile d'ambiente `DATABASE_URL` nelle impostazioni di Vercel!

## 📊 Struttura Database

Il database include le seguenti tabelle principali:

- **users**: Utenti del sistema
- **Places**: Luoghi/posti di magazzino
- **Zones**: Zone all'interno dei luoghi
- **Products**: Prodotti con campi dinamici (fld01-fld10, fldd01-fldd05)
- **Products_labels**: Etichette per i campi dinamici
- **Items**: Items RFID individuali
- **Movements**: Storico movimenti items
- **inventories**: Gestione inventari
- **inventory_items**: Items rilevati durante inventari
- **checklist**: Checklist per inventari

## 🎯 Funzionalità Principali

### Gestione Prodotti
- Creazione/modifica/eliminazione prodotti
- Campi dinamici configurabili tramite Products_labels
- Paginazione (50 prodotti per pagina)
- Filtri server-side su tutti i campi

### Gestione Items
- Visualizzazione items con dati prodotto
- Storico movimenti per ogni item
- Filtri avanzati con debounce
- Paginazione ottimizzata

### Inventari
- Creazione inventari con configurazione completa
- Rilevamento automatico: Expected, Unexpected, Lost
- Chiusura inventario con opzioni di trasferimento
- Export CSV dei risultati
- Vista aggregata per prodotto

### Menu Principale
- Design moderno con icone graduate
- Effetti hover avanzati
- Layout responsivo
- Navigazione intuitiva

## 🔒 Sicurezza

- Il file `.env.local` è escluso dal repository (contiene credenziali database)
- Validazione input lato server
- Gestione errori completa
- Foreign key constraints nel database

## 📝 File Ignorati (.gitignore)

Sono esclusi dal repository:
- `node_modules/` - Dipendenze npm
- `.next/` - Build Next.js
- `.env*.local` - File di configurazione con credenziali
- File di debug e test temporanei
- File di configurazione IDE

## 🤝 Contributi

Contributi, issues e feature requests sono benvenuti!

## 📄 Licenza

Questo progetto è proprietario.

## 👥 Autori

- Guido Guidetti
- Co-Authored-By: Claude Sonnet 4.5

## 📞 Contatti

Per domande o supporto, contattare il repository owner.

---

**Nota**: Ricordarsi di configurare correttamente le credenziali del database nel file `.env.local` prima di avviare l'applicazione.
