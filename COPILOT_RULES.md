# COPILOT DEVELOPMENT RULES & SAFETY GUIDELINES

## 🎯 CURRENT PROJECT CONTEXT

### Working Features (DO NOT BREAK):
-use ES Modules
-create test page for new features. click-to-save-test.html is a good page to start with
-create a plan prior to implimenting changes to the code, structure of the project. 
-use localHost:3000 for a test server, you may need to kill this first to get a fresh reload. 

-sqlite3 is the database for this project. 
-plain javascript, html and css.

path to database:
./server/locations.db

### Database Schema (CLEAN - Jan 2025):
saved_locations table contains only essential columns:
- Core location data (id, name, lat, lng, formatted_address, place_id)
- Production fields (production_notes, type, entry_point, parking, access)
- Address components (street, number, city, state, zipcode)
- Metadata (created_by, created_date, updated_date, is_permanent)

Photo functionality handled by separate location_photos table.





