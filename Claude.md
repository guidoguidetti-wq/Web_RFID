# Progetto RFID Management System

## Overview
Sistema di gestione RFID basato su Next.js (App Router), TypeScript, Tailwind CSS e PostgreSQL.
**Versione Corrente:** 2.2.2

## Tecnologie principali
- **Frontend:** Next.js, React, Tailwind CSS, Lucide React (icone).
- **Backend:** Next.js Route Handlers, `pg` (PostgreSQL client).
- **Database:** PostgreSQL (esterno).

## Struttura del Database
Il database contiene le seguenti tabelle principali:
- `users`: Gestione utenti (`usr_id`, `usr_name`, `usr_pwd`, `usr_def_place`).
- `Items`: Tag RFID o prodotti individuali.
- `Places` & `Zones`: Luoghi fisici e zone logiche.
- `Products`: Definizioni dei prodotti.
- `Movements`: Tracciamento spostamenti.
- `people`: Tabella per le persone (personale/utenti).
- `inventories`: Sessioni di inventario.

## Funzionalità implementate
- **Autenticazione:** Sistema di login con verifica su DB.
- **Menù Principale:** Dashboard di navigazione.
- **Gestione Anagrafiche (CRUD):**
    - **Utenti:** Gestione completa (Inserimento, Modifica, Cancellazione) della tabella `users`.
    - **Places:** Gestione completa della tabella `Places`.
    - **Zones:** Gestione completa della tabella `Zones`.

## Sviluppo
È stato creato un componente riutilizzabile `ManagementTable` per uniformare l'interfaccia di gestione delle varie tabelle del DB.

## Comandi utili
- `npm run dev`: Avvia l'ambiente di sviluppo.
- `npm run build`: Compila il progetto per la produzione.
- `npm start`: Avvia il server in produzione.