# COPILOT DEVELOPMENT RULES & SAFETY GUIDELINES

## 🎯 CURRENT PROJECT CONTEXT

-coding guideline:
- NO PROXY FUCTIONS (proxy delegation methods) - use direct function calls instead.
- Files are allowed 400 lines of code max, no more than 10 functions per file.
- use ES Modules 

- always use localhost:3000 for a test server, you may need to kill this first to get a fresh reload.

### Working Features (DO NOT BREAK):
-use ES Modules
-create test page for new features. 

-create a plan prior to implimenting changes to the code, structure of the project. 

-use localHost:3000 for a test server, you may need to kill this first to get a fresh reload. 

-sqlite3 is the database for this project
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


New Tech Stack:
- **JavaScript**: ES Modules, no frameworks
- **HTML/CSS**: Vanilla, no libraries
- **Image Uploads**: ImageKit
- **SMTP Email**: Mailtrap
- **Database**: MySQL
- **Server**: Node.js with Express (open to suggestions)
- **Need Demo Site to Production**: Yes, to showcase features and functionality




