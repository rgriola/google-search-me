# Full Database Migration to Render Guide

## Overview
This guide walks you through migrating your complete local database (users, locations, sessions) to Render's persistent storage.

## Your Current Data
- **2 Users**: rodczaro@gmail.com (admin), shanachie@gmail.com (regular)
- **14 Saved Locations**: Including permanent CNN locations with proper permission flags
- **Session Data**: User authentication and preferences

## Migration Process

### Step 1: Render Setup (Dashboard)

1. **Add Persistent Disk**:
   - Go to your Render service dashboard
   - Navigate to "Settings" → "Persistent Disks"
   - Click "Add Disk"
   - **Name**: `database-storage`
   - **Mount Path**: `/opt/render/project/database`
   - **Size**: 1GB

2. **Set Environment Variable**:
   - In "Environment" section, add:
   ```
   DATABASE_PATH=/opt/render/project/database/locations.db
   ```

### Step 2: Upload Database Backup

You have two options for uploading your backup:

#### Option A: Use Render's File Upload (if available)
1. Go to your service's "Shell" or "Connect" tab
2. Upload `database_backup.sql` to your service

#### Option B: Use Git (temporary)
1. **Temporarily add backup to git** (we'll remove it after):
   ```bash
   git add database_backup.sql
   git commit -m "temp: database backup for migration"
   git push origin main
   ```

2. **After migration, remove it**:
   ```bash
   git rm database_backup.sql
   git commit -m "remove database backup after migration"
   git push origin main
   ```

### Step 3: Deploy and Migrate

1. **Deploy your app** (it will create the empty database structure)

2. **Access Render Shell**:
   - Go to your service dashboard
   - Click "Shell" or "Connect"

3. **Run Migration**:
   ```bash
   # Check environment
   echo $DATABASE_PATH
   
   # Import your data
   sqlite3 $DATABASE_PATH < database_backup.sql
   
   # Verify import
   sqlite3 $DATABASE_PATH "SELECT COUNT(*) FROM users;"
   sqlite3 $DATABASE_PATH "SELECT COUNT(*) FROM saved_locations;"
   ```

4. **Alternative: Use migration script**:
   ```bash
   npm run migrate:db
   ```

### Step 4: Verify Migration

1. **Test your live site**:
   - Visit your Render URL
   - Try logging in with: `rodczaro@gmail.com`
   - Check that all 14 locations appear
   - Verify admin permissions work

2. **Test persistence**:
   - Add a test location
   - Trigger a deployment (git push)
   - Confirm the test location survives the deployment

### Step 5: Clean Up

1. **Remove backup from git** (if you used Option B):
   ```bash
   git rm database_backup.sql
   git commit -m "remove database backup after successful migration"
   git push origin main
   ```

2. **Update .gitignore** to ensure databases stay excluded:
   ```
   *.db
   *.sql
   database_backup.*
   ```

## Security Notes

- ✅ **Database contains real user passwords** (hashed)
- ✅ **Admin permissions preserved** for rodczaro@gmail.com
- ✅ **Location ownership preserved** for proper permission system
- ⚠️  **Remove backup files** from version control after migration

## Troubleshooting

### Database Not Found
```bash
# Check if persistent disk is mounted
ls -la /opt/render/project/database/

# Check environment variable
echo $DATABASE_PATH
```

### Import Errors
```bash
# Check SQL file exists
ls -la database_backup.sql

# Test database connection
sqlite3 $DATABASE_PATH "SELECT sqlite_version();"
```

### Permission Issues
- Render handles file permissions automatically
- Database files are created with correct permissions

## Rollback Plan

If something goes wrong:

1. **Backup current state**:
   ```bash
   sqlite3 $DATABASE_PATH .dump > rollback_backup.sql
   ```

2. **Start fresh**:
   ```bash
   rm $DATABASE_PATH
   # Restart your service to recreate empty database
   ```

3. **Re-import**:
   ```bash
   sqlite3 $DATABASE_PATH < database_backup.sql
   ```

## Success Validation

After migration, you should have:
- ✅ Login works for both users
- ✅ All 14 locations visible
- ✅ Admin can edit permanent locations
- ✅ Regular users cannot edit permanent locations
- ✅ Database survives deployments
- ✅ New locations can be added and persist

Your live demo will have all your local data while maintaining the permission system you built!
