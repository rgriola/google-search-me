-- Migration: Remove CHECK constraints from access fields
-- This removes restrictions on parking, entry_point, and access columns
-- allowing any text values to be stored

-- Step 1: Create new table without CHECK constraints on access fields
CREATE TABLE saved_locations_unrestricted (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    formatted_address TEXT,
    production_notes TEXT CHECK(length(production_notes) <= 500),
    type TEXT NOT NULL CHECK(type IN ('broll', 'interview', 'live anchor', 'live reporter', 'stakeout', 'headquarters', 'bureau', 'office')),
    entry_point TEXT,  -- RESTRICTION REMOVED
    parking TEXT,      -- RESTRICTION REMOVED
    access TEXT,       -- RESTRICTION REMOVED
    street TEXT,
    number TEXT,
    city TEXT,
    state TEXT CHECK(length(state) <= 2),
    zipcode TEXT CHECK(length(zipcode) <= 5),
    created_by INTEGER NOT NULL,
    created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    place_id TEXT UNIQUE NOT NULL
);

-- Step 2: Copy all existing data to new table (no data transformation needed)
INSERT INTO saved_locations_unrestricted (
    id, name, lat, lng, formatted_address, production_notes, type,
    entry_point, parking, access, street, number, city, state, zipcode,
    created_by, created_date, updated_date, place_id
)
SELECT 
    id, name, lat, lng, formatted_address, production_notes, type,
    entry_point, parking, access, street, number, city, state, zipcode,
    created_by, created_date, updated_date, place_id
FROM saved_locations;

-- Step 3: Drop old table and rename new table
DROP TABLE saved_locations;
ALTER TABLE saved_locations_unrestricted RENAME TO saved_locations;

-- Step 4: Recreate indexes for performance
CREATE INDEX idx_saved_locations_created_by ON saved_locations(created_by);
CREATE INDEX idx_saved_locations_type ON saved_locations(type);
CREATE INDEX idx_saved_locations_place_id ON saved_locations(place_id);

-- Step 5: Recreate the updated_date trigger
CREATE TRIGGER update_saved_locations_updated_date 
AFTER UPDATE ON saved_locations
FOR EACH ROW
BEGIN
    UPDATE saved_locations SET updated_date = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Migration complete: access fields (entry_point, parking, access) now accept any text values
