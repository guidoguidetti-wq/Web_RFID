-- =============================================
-- RFID Database Schema
-- Database creation script for PostgreSQL
-- =============================================

-- =============================================
-- 1. TABELLA: users
-- Gestione utenti del sistema
-- =============================================
CREATE TABLE users (
    usr_id SERIAL PRIMARY KEY,
    usr_name VARCHAR(100) NOT NULL UNIQUE,
    usr_pwd VARCHAR(255) NOT NULL,
    usr_def_place VARCHAR(50),
    usr_role VARCHAR(50) NOT NULL
);

-- =============================================
-- 2. TABELLA: Places
-- Gestione luoghi/posti
-- =============================================
CREATE TABLE "Places" (
    place_id VARCHAR(50) PRIMARY KEY,
    place_name VARCHAR(100) NOT NULL,
    place_type VARCHAR(50)
);

-- =============================================
-- 3. TABELLA: Zones
-- Gestione zone all'interno dei luoghi
-- =============================================
CREATE TABLE "Zones" (
    zone_id VARCHAR(50) PRIMARY KEY,
    zone_name VARCHAR(100) NOT NULL,
    zone_type VARCHAR(50)
);

-- =============================================
-- 4. TABELLA: Products_labels
-- Etichette per i campi dinamici dei prodotti
-- =============================================
CREATE TABLE "Products_labels" (
    label_id SERIAL PRIMARY KEY,
    field_name VARCHAR(50) NOT NULL UNIQUE,
    label_text VARCHAR(100) NOT NULL
);

-- =============================================
-- 5. TABELLA: Products
-- Gestione prodotti con campi dinamici
-- fld01-fld10: campi testuali
-- fldd01-fldd05: campi descrizione (testo lungo)
-- =============================================
CREATE TABLE "Products" (
    product_id VARCHAR(100) PRIMARY KEY,
    fld01 VARCHAR(255),
    fld02 VARCHAR(255),
    fld03 VARCHAR(255),
    fld04 VARCHAR(255),
    fld05 VARCHAR(255),
    fld06 VARCHAR(255),
    fld07 VARCHAR(255),
    fld08 VARCHAR(255),
    fld09 VARCHAR(255),
    fld10 VARCHAR(255),
    fldd01 TEXT,
    fldd02 TEXT,
    fldd03 TEXT,
    fldd04 TEXT,
    fldd05 TEXT
);

-- =============================================
-- 6. TABELLA: Items
-- Items/Oggetti RFID collegati ai prodotti
-- item_id corrisponde all'EPC del tag RFID
-- =============================================
CREATE TABLE "Items" (
    item_id VARCHAR(100) PRIMARY KEY,
    item_product_id VARCHAR(100),
    date_creation TIMESTAMP DEFAULT NOW(),
    date_lastseen TIMESTAMP,
    place_last VARCHAR(50),
    zone_last VARCHAR(50),
    FOREIGN KEY (item_product_id) REFERENCES "Products"(product_id) ON DELETE RESTRICT,
    FOREIGN KEY (place_last) REFERENCES "Places"(place_id) ON DELETE SET NULL,
    FOREIGN KEY (zone_last) REFERENCES "Zones"(zone_id) ON DELETE SET NULL
);

-- =============================================
-- 7. TABELLA: Movements
-- Tracciamento movimenti degli items
-- =============================================
CREATE TABLE "Movements" (
    mov_id SERIAL PRIMARY KEY,
    mov_epc VARCHAR(100) NOT NULL,
    mov_dest_place VARCHAR(50),
    mov_dest_zone VARCHAR(50),
    mov_timestamp TIMESTAMP DEFAULT NOW(),
    mov_user VARCHAR(100),
    mov_ref VARCHAR(255),
    mov_notes TEXT,
    mov_readscount INTEGER,
    mov_rssiavg DECIMAL(10,2),
    mov_item_id VARCHAR(100),
    FOREIGN KEY (mov_dest_place) REFERENCES "Places"(place_id) ON DELETE SET NULL,
    FOREIGN KEY (mov_dest_zone) REFERENCES "Zones"(zone_id) ON DELETE SET NULL,
    FOREIGN KEY (mov_item_id) REFERENCES "Items"(item_id) ON DELETE CASCADE
);

-- Indici per migliorare le performance
CREATE INDEX idx_movements_epc ON "Movements"(mov_epc);
CREATE INDEX idx_movements_timestamp ON "Movements"(mov_timestamp DESC);

-- =============================================
-- 8. TABELLA: checklist
-- Checklist per gli inventari
-- =============================================
CREATE TABLE checklist (
    chk_id SERIAL PRIMARY KEY,
    chk_code VARCHAR(100) NOT NULL UNIQUE,
    chk_place VARCHAR(50),
    FOREIGN KEY (chk_place) REFERENCES "Places"(place_id) ON DELETE SET NULL
);

-- =============================================
-- 9. TABELLA: inventories
-- Gestione inventari
-- =============================================
CREATE TABLE inventories (
    inv_id SERIAL PRIMARY KEY,
    inv_name VARCHAR(255) NOT NULL,
    inv_start_date TIMESTAMP DEFAULT NOW(),
    inv_place_id VARCHAR(50),
    inv_state VARCHAR(50) DEFAULT 'OPEN',
    inv_note TEXT,
    inv_chk_id INTEGER,
    inv_last BOOLEAN DEFAULT false,
    inv_last_place VARCHAR(50),
    inv_last_zones TEXT,
    inv_det_place VARCHAR(50),
    inv_det_zone VARCHAR(50),
    inv_mis_place VARCHAR(50),
    inv_mis_zone VARCHAR(50),
    FOREIGN KEY (inv_place_id) REFERENCES "Places"(place_id) ON DELETE SET NULL,
    FOREIGN KEY (inv_chk_id) REFERENCES checklist(chk_id) ON DELETE SET NULL,
    FOREIGN KEY (inv_det_place) REFERENCES "Places"(place_id) ON DELETE SET NULL,
    FOREIGN KEY (inv_det_zone) REFERENCES "Zones"(zone_id) ON DELETE SET NULL,
    FOREIGN KEY (inv_mis_place) REFERENCES "Places"(place_id) ON DELETE SET NULL,
    FOREIGN KEY (inv_mis_zone) REFERENCES "Zones"(zone_id) ON DELETE SET NULL
);

-- =============================================
-- 10. TABELLA: inventory_items
-- Items rilevati durante gli inventari
-- =============================================
CREATE TABLE inventory_items (
    int_id SERIAL PRIMARY KEY,
    int_inv_id INTEGER NOT NULL,
    int_epc VARCHAR(100) NOT NULL,
    inv_expected BOOLEAN DEFAULT false,
    inv_unexpected BOOLEAN DEFAULT false,
    inv_lost BOOLEAN DEFAULT false,
    FOREIGN KEY (int_inv_id) REFERENCES inventories(inv_id) ON DELETE CASCADE,
    UNIQUE(int_inv_id, int_epc)
);

-- Indici per migliorare le performance
CREATE INDEX idx_inventory_items_inv ON inventory_items(int_inv_id);
CREATE INDEX idx_inventory_items_epc ON inventory_items(int_epc);

-- =============================================
-- Fine dello script
-- =============================================
