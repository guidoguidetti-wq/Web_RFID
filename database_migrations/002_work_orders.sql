-- =============================================
-- Migration 002: Work Orders + Attachments + Raws
-- (versione corretta senza FK su wo_item_id)
-- =============================================

-- =============================================
-- TABELLA: work_orders
-- =============================================
CREATE TABLE work_orders (
    wo_id          SERIAL       PRIMARY KEY,
    wo_number      VARCHAR(50)  NOT NULL UNIQUE,
    wo_title       VARCHAR(255) NOT NULL,
    wo_description TEXT,
    wo_status      VARCHAR(30)  NOT NULL DEFAULT 'APERTO',
        -- APERTO | IN CORSO | CHIUSO | ANNULLATO
    wo_priority    VARCHAR(20)  NOT NULL DEFAULT 'NORMALE',
        -- BASSA | NORMALE | ALTA | URGENTE
    wo_item_id     VARCHAR(100),
        -- riferimento EPC RFID (senza FK per compatibilità)
    wo_assigned_to VARCHAR(255),
    wo_due_date    DATE,
    wo_notes       TEXT,
    wo_created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    wo_updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wo_status    ON work_orders(wo_status);
CREATE INDEX idx_wo_priority  ON work_orders(wo_priority);
CREATE INDEX idx_wo_number    ON work_orders(wo_number);

-- =============================================
-- TABELLA: work_orders_attach
-- att_type: 'image' | 'file'
-- =============================================
CREATE TABLE work_orders_attach (
    att_id         SERIAL       PRIMARY KEY,
    att_wo_id      INTEGER      NOT NULL,
    att_filename   VARCHAR(500) NOT NULL,
    att_type       VARCHAR(10)  NOT NULL,
    att_mime       VARCHAR(100),
    att_size       INTEGER,
    att_url        TEXT         NOT NULL,
    att_note       VARCHAR(500),
    att_created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    FOREIGN KEY (att_wo_id) REFERENCES work_orders(wo_id) ON DELETE CASCADE
);

CREATE INDEX idx_att_wo_id ON work_orders_attach(att_wo_id);

-- =============================================
-- TABELLA: work_orders_raws
-- Righe prodotto dell'ordine di lavoro
-- =============================================
CREATE TABLE work_orders_raws (
    wor_id         SERIAL       PRIMARY KEY,
    wor_wo_id      INTEGER      NOT NULL,
    wor_sku        VARCHAR(100) NOT NULL,
        -- product_id (senza FK per compatibilità)
    wor_qta        INTEGER      NOT NULL DEFAULT 1,
        -- quantità ordinata
    wor_printed    INTEGER      NOT NULL DEFAULT 0,
        -- quantità già stampata/prodotta
    wor_created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    FOREIGN KEY (wor_wo_id) REFERENCES work_orders(wo_id) ON DELETE CASCADE
);

CREATE INDEX idx_wor_wo_id ON work_orders_raws(wor_wo_id);
CREATE INDEX idx_wor_sku   ON work_orders_raws(wor_sku);
