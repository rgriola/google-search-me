#!/bin/bash

# Database Migration Script for Render
# This script helps migrate your local database data to Render's persistent storage

echo "🔄 Database Migration Helper for Render"
echo "========================================"

# Check if we're in production environment
if [ "$NODE_ENV" = "production" ]; then
    echo "✅ Production environment detected"
    DATABASE_PATH=${DATABASE_PATH:-"/opt/render/project/src/server/locations.db"}
else
    echo "ℹ️  Development environment detected"
    DATABASE_PATH="./server/locations.db"
fi

echo "📍 Database path: $DATABASE_PATH"

# Check if database exists
if [ -f "$DATABASE_PATH" ]; then
    echo "⚠️  Database already exists at $DATABASE_PATH"
    echo "   Current data will be preserved"
    
    # Show current data count
    echo "📊 Current database statistics:"
    sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) || ' users' FROM users;"
    sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) || ' saved locations' FROM saved_locations;"
    sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) || ' user sessions' FROM user_sessions;"
    
else
    echo "📁 Database does not exist, will be created"
fi

echo ""
echo "🚀 Full Data Migration Process:"
echo "================================"

# Function to import database from SQL file
import_database() {
    local sql_file="$1"
    local target_db="$2"
    
    if [ ! -f "$sql_file" ]; then
        echo "❌ SQL file not found: $sql_file"
        return 1
    fi
    
    echo "📥 Importing data from $sql_file to $target_db..."
    
    # Backup existing database if it exists
    if [ -f "$target_db" ]; then
        echo "💾 Backing up existing database..."
        cp "$target_db" "${target_db}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Import the data
    sqlite3 "$target_db" < "$sql_file"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database import successful!"
        echo "📊 New database statistics:"
        sqlite3 "$target_db" "SELECT COUNT(*) || ' users' FROM users;"
        sqlite3 "$target_db" "SELECT COUNT(*) || ' saved locations' FROM saved_locations;"
        return 0
    else
        echo "❌ Database import failed!"
        return 1
    fi
}

# Check if we have a SQL backup file to import
if [ -f "database_backup.sql" ]; then
    echo "📁 Found database_backup.sql file"
    read -p "🤔 Do you want to import this backup? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        import_database "database_backup.sql" "$DATABASE_PATH"
    fi
elif [ "$NODE_ENV" = "production" ]; then
    echo "ℹ️  No database_backup.sql found in production"
    echo "   You'll need to upload your backup file and run this script again"
fi

echo ""
echo "� Migration Steps for Render:"
echo "1. Set up persistent disk in Render dashboard"
echo "2. Set DATABASE_PATH environment variable"
echo "3. Upload database_backup.sql to your Render service"
echo "4. Run this script on Render to import the data"
echo ""
echo "💡 Pro tip: You can also use Render's shell access:"
echo "   sqlite3 \$DATABASE_PATH < database_backup.sql"
