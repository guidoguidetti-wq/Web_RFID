-- Migration 004: Add att_seen and att_down columns to work_orders_attach
-- Track when a file has been viewed or downloaded

ALTER TABLE work_orders_attach
  ADD COLUMN IF NOT EXISTS att_seen VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS att_down VARCHAR(255) NULL;
