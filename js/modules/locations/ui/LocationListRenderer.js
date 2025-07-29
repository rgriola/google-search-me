/**
 * Location List Renderer
 * Handles rendering of location lists and individual items
 */

import { LocationListTemplates } from './templates/LocationListTemplates.js';

export class LocationListRenderer {
  
  /**
   * Render locations list
   * @param {Array} locations - Array of locations to render
   * @param {string} containerId - ID of container element
   */
  static renderLocationsList(locations, containerId = 'savedLocationsList') {
    const listContainer = document.getElementById(containerId);
    
    if (!listContainer) {
      console.error(`❌ List container "${containerId}" not found!`);
      return;
    }

    if (!locations || locations.length === 0) {
      listContainer.innerHTML = LocationListTemplates.generateEmptyMessage();
      return;
    }

    const html = locations.map(location => 
      LocationListTemplates.generateLocationItem(location)
    ).join('');
    
    listContainer.innerHTML = html;
  }

  /**
   * Update a single location item in the list
   * @param {Object} location - Updated location data
   * @param {string} containerId - ID of container element
   */
  static updateLocationItem(location, containerId = 'savedLocationsList') {
    const listContainer = document.getElementById(containerId);
    if (!listContainer) return;
    
    const placeId = location.place_id || location.id;
    const existingItem = listContainer.querySelector(`[data-place-id="${placeId}"]`);
    
    if (existingItem) {
      const newItemHtml = LocationListTemplates.generateLocationItem(location);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = newItemHtml;
      const newItem = tempDiv.firstChild;
      
      existingItem.replaceWith(newItem);
    }
  }

  /**
   * Add a new location item to the list
   * @param {Object} location - New location data
   * @param {string} containerId - ID of container element
   * @param {string} position - Where to add ('top' or 'bottom')
   */
  static addLocationItem(location, containerId = 'savedLocationsList', position = 'top') {
    const listContainer = document.getElementById(containerId);
    if (!listContainer) return;
    
    // Remove "no locations" message if it exists
    const noLocationsMsg = listContainer.querySelector('.no-locations');
    if (noLocationsMsg) {
      noLocationsMsg.remove();
    }
    
    const newItemHtml = LocationListTemplates.generateLocationItem(location);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newItemHtml;
    const newItem = tempDiv.firstChild;
    
    if (position === 'top') {
      listContainer.insertBefore(newItem, listContainer.firstChild);
    } else {
      listContainer.appendChild(newItem);
    }
    
    // Add animation class
    newItem.classList.add('location-item-new');
    setTimeout(() => {
      newItem.classList.remove('location-item-new');
    }, 500);
  }

  /**
   * Remove a location item from the list
   * @param {string} placeId - Place ID of location to remove
   * @param {string} containerId - ID of container element
   */
  static removeLocationItem(placeId, containerId = 'savedLocationsList') {
    const listContainer = document.getElementById(containerId);
    if (!listContainer) return;
    
    const existingItem = listContainer.querySelector(`[data-place-id="${placeId}"]`);
    if (existingItem) {
      // Add animation class before removing
      existingItem.classList.add('location-item-removing');
      
      setTimeout(() => {
        existingItem.remove();
        
        // Show "no locations" message if list is empty
        if (listContainer.children.length === 0) {
          listContainer.innerHTML = LocationListTemplates.generateEmptyMessage();
        }
      }, 300);
    }
  }

  /**
   * Filter locations list by search term
   * @param {string} searchTerm - Search term to filter by
   * @param {string} containerId - ID of container element
   */
  static filterLocationsList(searchTerm, containerId = 'savedLocationsList') {
    const listContainer = document.getElementById(containerId);
    if (!listContainer) return;
    
    const locationItems = listContainer.querySelectorAll('.location-item');
    const term = searchTerm.toLowerCase().trim();
    
    let visibleCount = 0;
    
    locationItems.forEach(item => {
      const name = item.querySelector('.location-name')?.textContent.toLowerCase() || '';
      const address = item.querySelector('.location-address')?.textContent.toLowerCase() || '';
      const type = item.querySelector('p:nth-child(3)')?.textContent.toLowerCase() || '';
      
      const isVisible = !term || 
        name.includes(term) || 
        address.includes(term) || 
        type.includes(term);
      
      if (isVisible) {
        item.style.display = '';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });
    
    // Show/hide "no results" message
    const noResultsMsg = listContainer.querySelector('.no-search-results');
    if (term && visibleCount === 0) {
      if (!noResultsMsg) {
        const noResults = document.createElement('div');
        noResults.className = 'no-search-results';
        noResults.style.cssText = 'padding: 20px; text-align: center; color: #666;';
        noResults.innerHTML = `
          <p>No locations found matching "${searchTerm}"</p>
          <button onclick="this.parentElement.style.display='none'; window.LocationListRenderer.clearFilter('${containerId}')" 
                  style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
            Clear Filter
          </button>
        `;
        listContainer.appendChild(noResults);
      }
    } else if (noResultsMsg) {
      noResultsMsg.remove();
    }
  }

  /**
   * Clear location list filter
   * @param {string} containerId - ID of container element
   */
  static clearFilter(containerId = 'savedLocationsList') {
    const listContainer = document.getElementById(containerId);
    if (!listContainer) return;
    
    const locationItems = listContainer.querySelectorAll('.location-item');
    locationItems.forEach(item => {
      item.style.display = '';
    });
    
    const noResultsMsg = listContainer.querySelector('.no-search-results');
    if (noResultsMsg) {
      noResultsMsg.remove();
    }
  }

  /**
   * Sort locations list
   * @param {string} sortBy - Sort criteria ('name', 'type', 'created', 'updated')
   * @param {string} order - Sort order ('asc' or 'desc')
   * @param {string} containerId - ID of container element
   */
  static sortLocationsList(sortBy, order = 'asc', containerId = 'savedLocationsList') {
    const listContainer = document.getElementById(containerId);
    if (!listContainer) return;
    
    const locationItems = Array.from(listContainer.querySelectorAll('.location-item'));
    
    locationItems.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.querySelector('.location-name')?.textContent || '';
          bValue = b.querySelector('.location-name')?.textContent || '';
          break;
        case 'type':
          aValue = a.querySelector('p:nth-child(3)')?.textContent.replace('Type: ', '') || '';
          bValue = b.querySelector('p:nth-child(3)')?.textContent.replace('Type: ', '') || '';
          break;
        case 'created':
          aValue = a.querySelector('p:contains("Created:")') ? 
            new Date(a.querySelector('p:contains("Created:")').textContent.replace('Created: ', '')) : 
            new Date(0);
          bValue = b.querySelector('p:contains("Created:")') ? 
            new Date(b.querySelector('p:contains("Created:")').textContent.replace('Created: ', '')) : 
            new Date(0);
          break;
        default:
          aValue = a.querySelector('.location-name')?.textContent || '';
          bValue = b.querySelector('.location-name')?.textContent || '';
      }
      
      if (sortBy === 'created') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        const result = aValue.localeCompare(bValue);
        return order === 'asc' ? result : -result;
      }
    });
    
    // Re-append items in sorted order
    locationItems.forEach(item => listContainer.appendChild(item));
  }

  /**
   * Highlight a specific location item
   * @param {string} placeId - Place ID of location to highlight
   * @param {string} containerId - ID of container element
   * @param {number} duration - Highlight duration in ms
   */
  static highlightLocationItem(placeId, containerId = 'savedLocationsList', duration = 2000) {
    const listContainer = document.getElementById(containerId);
    if (!listContainer) return;
    
    const item = listContainer.querySelector(`[data-place-id="${placeId}"]`);
    if (item) {
      item.classList.add('location-item-highlighted');
      item.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setTimeout(() => {
        item.classList.remove('location-item-highlighted');
      }, duration);
    }
  }

  /**
   * Get location item element by place ID
   * @param {string} placeId - Place ID to find
   * @param {string} containerId - ID of container element
   * @returns {HTMLElement|null} Location item element
   */
  static getLocationItem(placeId, containerId = 'savedLocationsList') {
    const listContainer = document.getElementById(containerId);
    if (!listContainer) return null;
    
    return listContainer.querySelector(`[data-place-id="${placeId}"]`);
  }

  /**
   * Get all visible location items
   * @param {string} containerId - ID of container element
   * @returns {NodeList} List of visible location items
   */
  static getVisibleLocationItems(containerId = 'savedLocationsList') {
    const listContainer = document.getElementById(containerId);
    if (!listContainer) return [];
    
    return listContainer.querySelectorAll('.location-item:not([style*="display: none"])');
  }
}
