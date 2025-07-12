#!/bin/bash

# Quick backup script for safe development
# Usage: ./backup.sh "description of what you're about to change"

if [ -z "$1" ]; then
    echo "❌ Error: Please provide a description"
    echo "Usage: ./backup.sh 'description of changes'"
    exit 1
fi

# Create timestamped backup commit
timestamp=$(date "+%Y%m%d_%H%M%S")
git add .
git commit -m "BACKUP $timestamp: $1"

echo "✅ Backup created: $1"
echo "🔄 To restore: git reset --hard HEAD~1"
