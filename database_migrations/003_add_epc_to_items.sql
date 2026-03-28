-- Migration 003: Add epc column to Items table
-- Used for warranty activation tracking

ALTER TABLE "Items"
  ADD COLUMN IF NOT EXISTS epc VARCHAR(255) NULL;
