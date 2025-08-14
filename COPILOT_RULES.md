# COPILOT DEVELOPMENT RULES & SAFETY GUIDELINES

## 🚨 CRITICAL: DO NOT BREAK WORKING CODE
**⚠️ BEFORE ANY REFACTORING OR CODE CHANGES:**
1. **Test existing functionality FIRST** - if it works, document what works
2. **Never alter working forms, API endpoints, or user-facing features** without explicit permission
3. **When refactoring is requested:**
   - Ask which specific part needs refactoring
   - Preserve all working functionality
   - Test each change incrementally
   - If something breaks, revert immediately
4. **Photo loading, form submissions, and dialog systems are CRITICAL** - do not modify selectors, container IDs, or API calls unless specifically broken
5. **If user says "it's working now" - STOP CHANGES** to that component

## 🎯 CURRENT PROJECT CONTEXT
-coding guideline:
- NO PROXY FUCTIONS (proxy delegation methods) - use direct function calls instead.
- Files are allowed 400 lines of code max, no more than 10 functions per file.
- use ES Modules 

- any test file must begin with "test-".
- check test directory before making new test files as there may already be a test file for the feature you are working on.
- comment all test files at the top to describe the purpose of the test and dependencies for other agents to understand.

- always use localhost:3000 for a test server, you may need to kill this first to get a fresh reload.

- all js functions and parameters must be in camelCase.

- No inline styles, use CSS classes only.

- initial script load should have cache versioning, e.g. `main.js?v=1.2.0` to prevent caching issues. and dev cache clearing.

### Working Features (DO NOT BREAK):
**🔒 PROTECTED COMPONENTS** (modify only if explicitly broken):
- **Photo Loading System**: LocationPhotoManager.loadDialogPhotos() and container selectors
- **Form Submission Pipeline**: LocationFormManager.extractFormData() and validation
- **Location Dialog System**: LocationDialogManager template generation and photo integration
- **Database Queries**: photoService.getLocationPhotos() and API endpoints
- **Container Selectors**: `.location-photos-container[data-place-id]` and `#location-photos-${placeId}`

**✅ VERIFIED WORKING SYSTEMS:**
- Photo viewing in location dialogs ✅
- Click-to-save location forms ✅  
- View location button with map centering ✅
- Photo upload and caption system ✅
- Database photo storage and retrieval ✅

-use ES Modules
-create test page for new features. 

-create a plan prior to implimenting changes to the code, structure of the project. 

-use localHost:3000 for a test server, you may need to kill this first to get a fresh reload.

-sqlite3 is the database for this project
-plain javascript, html and css.

- use the NotificationService rather than system alerts. Red for warnings green for success, blue for info.

path to dev database:
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
- No inline onclick handlers, use event delegation only
- Sanitize and Validate all user inputs and outputs.
- **Image Uploads**: ImageKit
- **SMTP Email**: Mailtrap
- **Database**: MySQL
- **Server**: Node.js with Express (open to suggestions)
- **Need Demo Site to Production**: Yes, to showcase features and functionality