/**
 * Locations Import/Export Service
 * Handles import/export functionality for locations data
 */

import { StateManager } from '../state/AppState.js';
import { LocationsAPIService } from './LocationsAPIService.js';
import { LocationsStorageService } from './LocationsStorageService.js';
import { LocationsDataService } from './LocationsDataService.js';

/**
 * Locations Import/Export Service Class
 */
export class LocationsImportExportService {

  /**
   * Export saved locations to JSON file
   * @returns {string} JSON string of locations
   */
  static exportLocations() {
    const locations = LocationsDataService.getAllSavedLocations();
    const exportData = {
      exported_at: new Date().toISOString(),
      total_locations: locations.length,
      export_version: '1.0',
      locations: locations.map(loc => ({
        ...loc,
        // Remove API-specific fields for portability
        id: undefined,
        user_id: undefined,
        created_at: undefined,
        updated_at: undefined
      }))
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Export locations as CSV
   * @returns {string} CSV string of locations
   */
  static exportLocationsAsCSV() {
    const locations = LocationsDataService.getAllSavedLocations();
    
    if (locations.length === 0) {
      return 'No locations to export';
    }
    
    // Define CSV headers
    const headers = [
      'name',
      'address',
      'place_id',
      'latitude',
      'longitude',
      'category',
      'type',
      'rating',
      'description',
      'notes',
      'creator_email',
      'creator_name'
    ];
    
    // Create CSV content
    const csvRows = [headers.join(',')];
    
    locations.forEach(location => {
      const row = headers.map(header => {
        let value = '';
        
        switch (header) {
          case 'latitude':
            value = location.geometry?.location?.lat || '';
            break;
          case 'longitude':
            value = location.geometry?.location?.lng || '';
            break;
          default:
            value = location[header] || '';
        }
        
        // Escape CSV values
        if (typeof value === 'string') {
          value = value.replace(/"/g, '""'); // Escape quotes
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            value = `"${value}"`;
          }
        }
        
        return value;
      });
      
      csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
  }

  /**
   * Import locations from JSON data
   * @param {string} jsonData - JSON string of locations
   * @returns {Promise<Object>} Import result with count and errors
   */
  static async importLocations(jsonData) {
    try {
      const importData = JSON.parse(jsonData);
      
      if (!importData.locations || !Array.isArray(importData.locations)) {
        throw new Error('Invalid import data format - missing locations array');
      }

      let importedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      const errors = [];
      
      for (const locationData of importData.locations) {
        try {
          // Validate location data
          const validation = LocationsDataService.validateLocationData(locationData);
          if (!validation.isValid) {
            errors.push(`Invalid location data for ${locationData.name || 'Unknown'}: ${validation.errors.join(', ')}`);
            errorCount++;
            continue;
          }
          
          // Check if location already exists
          if (locationData.place_id && LocationsDataService.isLocationSaved(locationData.place_id)) {
            console.log(`Location ${locationData.name} already exists, skipping...`);
            skippedCount++;
            continue;
          }
          
          // Try to save the location
          try {
            // Check if user is authenticated for API save
            if (StateManager.isAuthenticated()) {
              await LocationsAPIService.saveToAPI(locationData);
            } else {
              LocationsStorageService.saveToLocalStorage(locationData);
            }
            importedCount++;
          } catch (saveError) {
            console.warn(`Failed to import location ${locationData.name}:`, saveError);
            errors.push(`Failed to save ${locationData.name}: ${saveError.message}`);
            errorCount++;
          }
          
        } catch (locationError) {
          console.warn(`Error processing location:`, locationError);
          errors.push(`Error processing location: ${locationError.message}`);
          errorCount++;
        }
      }

      // Dispatch import complete event
      this.dispatchLocationsEvent('locations-imported', { 
        importedCount,
        skippedCount,
        errorCount,
        errors,
        totalProcessed: importData.locations.length
      });

      return {
        success: true,
        importedCount,
        skippedCount,
        errorCount,
        errors,
        totalProcessed: importData.locations.length
      };

    } catch (error) {
      console.error('Error importing locations:', error);
      
      // Dispatch import error event
      this.dispatchLocationsEvent('import-error', { error });
      
      throw new Error(`Import failed: ${error.message}`);
    }
  }

  /**
   * Import locations from CSV data
   * @param {string} csvData - CSV string of locations
   * @returns {Promise<Object>} Import result with count and errors
   */
  static async importLocationsFromCSV(csvData) {
    try {
      const lines = csvData.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV must have at least header row and one data row');
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataLines = lines.slice(1);
      
      const locations = [];
      
      for (const line of dataLines) {
        try {
          const values = this.parseCSVLine(line);
          const location = {};
          
          headers.forEach((header, index) => {
            const value = values[index] || '';
            
            switch (header) {
              case 'latitude':
                if (value && !isNaN(value)) {
                  if (!location.geometry) location.geometry = { location: {} };
                  location.geometry.location.lat = parseFloat(value);
                }
                break;
              case 'longitude':
                if (value && !isNaN(value)) {
                  if (!location.geometry) location.geometry = { location: {} };
                  location.geometry.location.lng = parseFloat(value);
                }
                break;
              case 'rating':
                if (value && !isNaN(value)) {
                  location.rating = parseFloat(value);
                }
                break;
              default:
                if (value) {
                  location[header] = value;
                }
            }
          });
          
          // Ensure required fields
          if (location.name && location.place_id) {
            locations.push(location);
          }
          
        } catch (lineError) {
          console.warn('Error parsing CSV line:', lineError);
        }
      }
      
      // Convert to JSON format and import
      const jsonData = JSON.stringify({
        imported_at: new Date().toISOString(),
        total_locations: locations.length,
        locations
      });
      
      return await this.importLocations(jsonData);
      
    } catch (error) {
      console.error('Error importing CSV:', error);
      throw new Error(`CSV import failed: ${error.message}`);
    }
  }

  /**
   * Parse a CSV line handling quoted values
   * @param {string} line - CSV line to parse
   * @returns {Array} Array of parsed values
   */
  static parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add final field
    values.push(current.trim());
    
    return values;
  }

  /**
   * Download data as file
   * @param {string} data - Data to download
   * @param {string} filename - Filename for download
   * @param {string} mimeType - MIME type for file
   */
  static downloadAsFile(data, filename, mimeType = 'application/json') {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  }

  /**
   * Export and download locations as JSON
   * @param {string} filename - Optional filename
   */
  static exportAndDownloadJSON(filename) {
    const jsonData = this.exportLocations();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `saved-locations-${timestamp}.json`;
    
    this.downloadAsFile(jsonData, filename || defaultFilename, 'application/json');
  }

  /**
   * Export and download locations as CSV
   * @param {string} filename - Optional filename
   */
  static exportAndDownloadCSV(filename) {
    const csvData = this.exportLocationsAsCSV();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = `saved-locations-${timestamp}.csv`;
    
    this.downloadAsFile(csvData, filename || defaultFilename, 'text/csv');
  }

  /**
   * Create backup of current locations
   * @returns {string} Backup data as JSON string
   */
  static createBackup() {
    const locations = LocationsDataService.getAllSavedLocations();
    const backupData = {
      backup_created_at: new Date().toISOString(),
      backup_version: '1.0',
      total_locations: locations.length,
      app_version: '1.0', // Could be dynamic
      locations
    };
    
    return JSON.stringify(backupData, null, 2);
  }

  /**
   * Restore from backup
   * @param {string} backupData - Backup data as JSON string
   * @returns {Promise<Object>} Restore result
   */
  static async restoreFromBackup(backupData) {
    try {
      const backup = JSON.parse(backupData);
      
      if (!backup.locations || !Array.isArray(backup.locations)) {
        throw new Error('Invalid backup format');
      }
      
      // Clear existing locations if requested
      // This could be made optional in the UI
      console.log('Restoring backup with', backup.locations.length, 'locations');
      
      // Import the backup locations
      const importResult = await this.importLocations(JSON.stringify({
        imported_at: new Date().toISOString(),
        locations: backup.locations
      }));
      
      // Dispatch restore complete event
      this.dispatchLocationsEvent('backup-restored', {
        ...importResult,
        backupDate: backup.backup_created_at
      });
      
      return importResult;
      
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw new Error(`Backup restore failed: ${error.message}`);
    }
  }

  /**
   * Dispatch locations event
   * @param {string} eventType - Event type
   * @param {Object} data - Event data
   */
  static dispatchLocationsEvent(eventType, data) {
    window.dispatchEvent(new CustomEvent(`locations-${eventType}`, { detail: data }));
  }
}

// Export individual functions for backward compatibility
export const exportLocations = LocationsImportExportService.exportLocations.bind(LocationsImportExportService);
export const importLocations = LocationsImportExportService.importLocations.bind(LocationsImportExportService);
export const exportAndDownloadJSON = LocationsImportExportService.exportAndDownloadJSON.bind(LocationsImportExportService);
export const exportAndDownloadCSV = LocationsImportExportService.exportAndDownloadCSV.bind(LocationsImportExportService);
