# 📸 Photo Integration Flow & Data Architecture

## 🔄 **INFORMATION FLOW**

### **1. Upload Process Flow**
```
User Browser → Multer → PhotoService → ImageKit → Database → Response
```

**Detailed Steps:**
1. **Frontend**: User selects photo file + provides Place ID + optional caption
2. **Multer**: Validates file (type, size) and stores in memory buffer
3. **PhotoService**: Generates unique filename, uploads to ImageKit
4. **ImageKit**: Stores file, returns metadata (file ID, path, dimensions, etc.)
5. **Database**: Saves photo metadata to `location_photos` table
6. **Response**: Returns success + optimized URLs for immediate use

### **2. Retrieval Flow**
```
Request → Database → ImageKit URL Generation → Optimized URLs → Response
```

---

## 📋 **REQUIRED INFORMATION**

### **For Upload (Required):**
- `photo` (file): Image file (JPEG, PNG, WebP, max 10MB)
- `placeId` (string): Google Place ID for the location
- `Authorization` header: Bearer token for authenticated user

### **For Upload (Optional):**
- `caption` (string): Photo description/caption

### **For Retrieval:**
- `placeId` (string): Google Place ID to get photos for

---

## 🗃️ **DATA STORAGE ARCHITECTURE**

### **Primary Table: `location_photos`**
```sql
CREATE TABLE location_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,        -- Internal photo ID
    place_id TEXT NOT NULL,                      -- Google Place ID (FK)
    user_id INTEGER,                             -- User who uploaded (FK)
    imagekit_file_id TEXT UNIQUE NOT NULL,       -- ImageKit unique file ID
    imagekit_file_path TEXT NOT NULL,            -- ImageKit file path for URLs
    original_filename TEXT,                      -- Original file name
    file_size INTEGER,                           -- File size in bytes
    mime_type TEXT,                              -- File MIME type
    width INTEGER,                               -- Image width in pixels
    height INTEGER,                              -- Image height in pixels
    is_primary BOOLEAN DEFAULT FALSE,            -- Primary photo flag
    caption TEXT,                                -- User caption
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Legacy Support: `saved_locations` (Extended)**
```sql
-- These columns were added for backward compatibility
ALTER TABLE saved_locations ADD COLUMN imagekit_file_id TEXT;
ALTER TABLE saved_locations ADD COLUMN imagekit_file_path TEXT;
ALTER TABLE saved_locations ADD COLUMN photo_urls TEXT DEFAULT '[]';
ALTER TABLE saved_locations ADD COLUMN photo_uploaded_by INTEGER;
ALTER TABLE saved_locations ADD COLUMN photo_uploaded_at DATETIME;
ALTER TABLE saved_locations ADD COLUMN original_filename TEXT;
```

---

## 🌐 **PHOTO URL MANAGEMENT**

### **ImageKit Storage Structure:**
```
https://ik.imagekit.io/your_imagekit_id/
└── locations/
    ├── place123_1642781234567_photo.jpg
    ├── place456_1642781234890_image.png
    └── ...
```

### **Generated URLs (5 Variants):**
```javascript
{
    thumbnail: "https://ik.imagekit.io/.../tr:w-150,h-150,c-pad_resize",
    card: "https://ik.imagekit.io/.../tr:w-300,h-200,c-pad_resize,q-80",
    large: "https://ik.imagekit.io/.../tr:w-800,h-600,c-pad_resize,q-85",
    mobile: "https://ik.imagekit.io/.../tr:w-400,h-300,c-pad_resize,q-80,f-webp",
    original: "https://ik.imagekit.io/.../original-file-path"
}
```

### **URL Optimization Presets:**
```javascript
const IMAGE_PRESETS = {
    thumbnail: { width: 150, height: 150, crop: 'pad_resize', background: 'auto' },
    card: { width: 300, height: 200, crop: 'pad_resize', quality: 80 },
    large: { width: 800, height: 600, crop: 'pad_resize', quality: 85 },
    mobile: { width: 400, height: 300, crop: 'pad_resize', quality: 80, format: 'webp' }
};
```

---

## 📊 **METADATA TRACKING**

### **Photo Record Example:**
```javascript
{
    id: 1,
    place_id: "ChIJN1t_tDeuEmsRUsoyG83frY4",
    user_id: 42,
    imagekit_file_id: "63f8b1234567890abcdef123",
    imagekit_file_path: "/locations/place123_1642781234567_cafe_photo.jpg",
    original_filename: "my_cafe_photo.jpg",
    file_size: 2048576,        // 2MB in bytes
    mime_type: "image/jpeg",
    width: 1920,
    height: 1080,
    is_primary: true,
    caption: "Great coffee and atmosphere!",
    uploaded_at: "2025-01-20T10:30:00Z",
    
    // Generated at runtime:
    urls: {
        thumbnail: "https://ik.imagekit.io/.../tr:w-150,h-150...",
        card: "https://ik.imagekit.io/.../tr:w-300,h-200...",
        large: "https://ik.imagekit.io/.../tr:w-800,h-600...",
        mobile: "https://ik.imagekit.io/.../tr:w-400,h-300,f-webp...",
        original: "https://ik.imagekit.io/.../original"
    },
    uploaded_by_username: "john_doe"
}
```

---

## 🔑 **API ENDPOINTS**

### **1. Upload Photo**
```
POST /api/photos/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- photo: <file>
- placeId: "ChIJN1t_tDeuEmsRUsoyG83frY4"
- caption: "Optional description"
```

### **2. Get Location Photos**
```
GET /api/photos/location/:placeId

Response:
{
    "success": true,
    "data": [
        {
            "id": 1,
            "place_id": "ChIJN1t_tDeuEmsRUsoyG83frY4",
            "caption": "Great place!",
            "is_primary": true,
            "urls": { ... },
            "uploaded_by_username": "john_doe"
        }
    ]
}
```

### **3. Delete Photo**
```
DELETE /api/photos/:photoId
Authorization: Bearer <token>
```

### **4. Set Primary Photo**
```
PUT /api/photos/:photoId/primary
Authorization: Bearer <token>
Body: { "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4" }
```

---

## 🔒 **PERMISSIONS & SECURITY**

### **Upload Permissions:**
- ✅ Authenticated users only
- ✅ File type validation (JPEG, PNG, WebP)
- ✅ File size limit (10MB)
- ✅ Unique filenames prevent conflicts

### **Delete Permissions:**
- ✅ Users can delete their own photos
- ✅ Admins can delete any photo
- ✅ Cascading: Primary photo reassignment

### **View Permissions:**
- ✅ Anyone can view photos (public)
- ✅ Metadata includes uploader username

---

## 🧪 **TESTING REQUIREMENTS**

### **Environment Variables Needed:**
```bash
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key  
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id
```

### **Test Data Needed:**
1. **Valid Google Place ID** (from Google Maps)
2. **Test user account** (authenticated)
3. **Sample images** (JPEG/PNG under 10MB)

### **Testing Flow:**
1. Start server: `npm start`
2. Open: `http://localhost:3000/test-photo-upload.html`
3. Login with test user
4. Upload photo with valid Place ID
5. Verify photo appears in gallery
6. Test different image sizes/formats

---

This architecture provides a robust, scalable photo system with ImageKit's CDN optimization and proper metadata tracking in your existing database structure.
