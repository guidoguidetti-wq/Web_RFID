-- Migration: Add RFID Tag Association to People Table
-- Description: Adds field for RFID tag association to enable QR code onboarding
-- Date: 2026-02-10

-- Add RFID tag column to People table
ALTER TABLE "People"
ADD COLUMN rfid_tag_id VARCHAR(100);

-- Create index for performance on RFID lookups
CREATE INDEX idx_people_rfid_tag ON "People"(rfid_tag_id);

-- Add UNIQUE constraint: one RFID tag can only be associated with one person
ALTER TABLE "People"
ADD CONSTRAINT uq_people_rfid_tag UNIQUE (rfid_tag_id);

-- Optional Foreign Key (commented out for flexibility)
-- Uncomment if you want to enforce referential integrity with Items table
-- ALTER TABLE "People"
-- ADD CONSTRAINT fk_people_rfid_tag
-- FOREIGN KEY (rfid_tag_id) REFERENCES "Items"(item_id)
-- ON DELETE SET NULL;

-- Verification query
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'People' AND column_name = 'rfid_tag_id';
