-- =============================================
-- RFID Database - Sample Data
-- Dati di esempio per testare l'applicazione
-- =============================================

-- =============================================
-- 1. DATI ESEMPIO: Places
-- =============================================
INSERT INTO "Places" (place_id, place_name, place_type) VALUES
('WHS', 'Warehouse', 'Storage'),
('TST', 'Test Area', 'Testing'),
('SHP', 'Shipping', 'Logistics'),
('RCV', 'Receiving', 'Logistics')
ON CONFLICT (place_id) DO NOTHING;

-- =============================================
-- 2. DATI ESEMPIO: Zones
-- =============================================
INSERT INTO "Zones" (zone_id, zone_name, zone_type) VALUES
('A01', 'Zone A01', 'Storage'),
('A02', 'Zone A02', 'Storage'),
('B01', 'Zone B01', 'Testing'),
('C01', 'Zone C01', 'Shipping'),
('R01', 'Zone R01', 'Receiving')
ON CONFLICT (zone_id) DO NOTHING;

-- =============================================
-- 3. DATI ESEMPIO: Users
-- Password di default: 'password123' (in produzione usare hash sicuri!)
-- =============================================
INSERT INTO users (usr_name, usr_pwd, usr_def_place, usr_role) VALUES
('admin', 'password123', 'WHS', 'admin'),
('operator1', 'password123', 'WHS', 'operator'),
('operator2', 'password123', 'TST', 'operator')
ON CONFLICT (usr_name) DO NOTHING;

-- =============================================
-- 4. DATI ESEMPIO: Products_labels
-- Definizione etichette per i campi dinamici dei prodotti
-- =============================================
INSERT INTO "Products_labels" (field_name, label_text) VALUES
('product_id', 'ID Prodotto'),
('fld01', 'Codice'),
('fld02', 'Descrizione'),
('fld03', 'Categoria'),
('fld04', 'Taglia'),
('fld05', 'Colore'),
('fld06', 'Brand'),
('fld07', 'Stagione'),
('fld08', 'Anno'),
('fld09', 'Fornitore'),
('fld10', 'Note'),
('fldd01', 'Descrizione Estesa'),
('fldd02', 'Specifiche Tecniche'),
('fldd03', 'Note Aggiuntive'),
('fldd04', 'Materiali'),
('fldd05', 'Istruzioni')
ON CONFLICT (field_name) DO NOTHING;

-- =============================================
-- 5. DATI ESEMPIO: Products
-- Alcuni prodotti di esempio
-- =============================================
INSERT INTO "Products" (product_id, fld01, fld02, fld03, fldd01) VALUES
('PROD001', 'ABC123', 'T-Shirt Blu', 'M', 'Maglietta in cotone 100% colore blu'),
('PROD002', 'ABC124', 'T-Shirt Rossa', 'L', 'Maglietta in cotone 100% colore rosso'),
('PROD003', 'XYZ789', 'Jeans Slim', '32', 'Jeans slim fit denim blu scuro')
ON CONFLICT (product_id) DO NOTHING;

-- =============================================
-- 6. DATI ESEMPIO: Checklist (opzionale)
-- =============================================
INSERT INTO checklist (chk_code, chk_place) VALUES
('CHK-WHS-001', 'WHS'),
('CHK-TST-001', 'TST')
ON CONFLICT (chk_code) DO NOTHING;

-- =============================================
-- Fine dati di esempio
-- =============================================
