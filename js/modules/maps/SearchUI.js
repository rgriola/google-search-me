/**
 * Search UI management
 * Handles search input, suggestions display, and keyboard navigation
 */

import { AppState, StateManager } from '../state/AppState.js';
import { SearchService } from './SearchService.js';

/**
 * Search UI Class
 */
export class SearchUI {

  /**
   * Initialize search UI components
   */
  static initialize() {
    console.log('🎨 Initializing Search UI');
    
    // Try to setup elements immediately
    let elementsSetup = this.setupSearchElements();
    
    // If elements not found, try again after a short delay
    if (!elementsSetup) {
      console.warn('⚠️ Search elements not found, retrying in 100ms...');
      setTimeout(() => {
        elementsSetup = this.setupSearchElements();
        if (elementsSetup) {
          this.setupEventListeners();
          console.log('✅ Search UI initialized (delayed)');
        } else {
          console.error('❌ SearchUI initialization failed - elements still not found after retry');
        }
      }, 100);
      return false;
    }
    
    this.setupEventListeners();
    
    console.log('✅ Search UI initialized');
    return true;
  }

  /**
   * Setup search DOM elements
   */
  static setupSearchElements() {
    this.searchInput = document.getElementById('searchInput');
    this.searchButton = document.getElementById('searchButton');
    this.suggestionsContainer = document.getElementById('suggestions');
    
    console.log('🔍 SearchUI setupSearchElements - searchInput:', this.searchInput);
    console.log('🔍 SearchUI setupSearchElements - searchButton:', this.searchButton);
    console.log('🔍 SearchUI setupSearchElements - suggestionsContainer:', this.suggestionsContainer);
    
    if (!this.searchInput || !this.searchButton) {
      console.warn('Search elements not found in DOM');
      return false;
    }

    // Initialize search state - FIXED: Access AppState directly
    AppState.currentSuggestions = [];
    AppState.selectedSuggestionIndex = -1;
    
    return true;
  }

  /**
   * Setup search event listeners
   */
  static setupEventListeners() {
    if (!this.searchInput || !this.searchButton) {
      console.error('❌ SearchUI setupEventListeners - Missing search elements');
      return;
    }

    console.log('✅ SearchUI setupEventListeners - Attaching event listeners to:', this.searchInput);

    // Search input events
    this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
    this.searchInput.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.searchInput.addEventListener('focus', this.handleSearchFocus.bind(this));
    this.searchInput.addEventListener('blur', this.handleSearchBlur.bind(this));

    // Search button event
    this.searchButton.addEventListener('click', this.handleSearchSubmit.bind(this));

    console.log('✅ SearchUI setupEventListeners - All event listeners attached');

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        this.hideSuggestions();
      }
    });

    // Enter key on search button
    this.searchButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleSearchSubmit();
      }
    });
  }

  /**
   * Handle search input changes
   * @param {Event} event - Input event
   */
  static async handleSearchInput(event) {
    const query = event.target.value.trim();
    console.log('🔍 SearchUI handleSearchInput called with query:', query);
    
    if (query.length < 2) {
      this.hideSuggestions();
      AppState.currentSuggestions = [];
      return;
    }

    try {
      // Show subtle loading indicator
      this.showLoadingState();
      
      console.log('🔍 SearchUI calling SearchService.getPlacePredictions with:', query);
      // Get place predictions (now with debouncing built-in)
      const predictions = await SearchService.getPlacePredictions(query);
      console.log('🔍 SearchUI received predictions:', predictions);
      
      // Update state
      AppState.currentSuggestions = predictions;
      AppState.selectedSuggestionIndex = -1;
      
      // Display suggestions
      this.displaySuggestions(predictions);
      
    } catch (error) {
      console.error('Search input error:', error);
      this.hideSuggestions();
      AppState.currentSuggestions = [];
    } finally {
      // Always remove loading state
      this.hideLoadingState();
    }
  }

  /**
   * Handle keyboard navigation
   * @param {Event} event - Keyboard event
   */
  static handleKeyDown(event) {
    const suggestions = AppState.currentSuggestions;
    let selectedIndex = AppState.selectedSuggestionIndex;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, suggestions.length - 1);
        this.updateSuggestionSelection(selectedIndex);
        break;

      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        this.updateSuggestionSelection(selectedIndex);
        break;

      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          this.selectSuggestion(suggestions[selectedIndex]);
        } else {
          this.handleSearchSubmit();
        }
        break;

      case 'Escape':
        this.hideSuggestions();
        this.searchInput.blur();
        break;

      case 'Tab':
        // Allow tab to work normally
        this.hideSuggestions();
        break;
    }
  }

  /**
   * Handle search input focus
   */
  static handleSearchFocus() {
    const query = this.searchInput.value.trim();
    const suggestions = AppState.currentSuggestions;
    
    if (query.length >= 2 && suggestions.length > 0) {
      this.displaySuggestions(suggestions);
    }
  }

  /**
   * Handle search input blur (with delay for click events)
   */
  static handleSearchBlur() {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      this.hideSuggestions();
    }, 150);
  }

  /**
   * Handle search submit (button click or enter key)
   */
  static async handleSearchSubmit() {
    const query = this.searchInput.value.trim();
    
    if (!query) return;

    try {
      this.showLoadingState();
      
      // Process search query
      const result = await SearchService.processSearchQuery(query);
      
      // Hide suggestions
      this.hideSuggestions();
      
      // Trigger search complete event
      this.dispatchSearchEvent('search-complete', { query, result });
      
    } catch (error) {
      console.error('Search submit error:', error);
      this.dispatchSearchEvent('search-error', { query, error });
    } finally {
      this.hideLoadingState();
    }
  }

  /**
   * Display search suggestions
   * @param {Array} predictions - Array of place predictions
   */
  static displaySuggestions(predictions) {
    if (!this.suggestionsContainer || !predictions.length) {
      this.hideSuggestions();
      return;
    }

    const suggestionsHTML = predictions.map((prediction, index) => {
      const isSelected = index === AppState.selectedSuggestionIndex;
      
      // Use raw Google Places API data (like test page) - no spacing modification
      const mainText = prediction.structured_formatting.main_text;
      const secondaryText = prediction.structured_formatting.secondary_text || '';
      const description = prediction.description || '';
      
      console.log('Suggestion data (raw):');
      console.log('mainText:', JSON.stringify(mainText));
      console.log('secondaryText:', JSON.stringify(secondaryText));
      console.log('description:', JSON.stringify(description));
      
      return `
        <div class="suggestion-item ${isSelected ? 'selected' : ''}" 
             data-place-id="${prediction.place_id}" 
             data-index="${index}">
          <div class="suggestion-main">
            <span class="suggestion-name">${this.highlightMatch(mainText, this.searchInput.value)}</span>
          </div>
          <div class="suggestion-secondary">
            <span class="suggestion-description">${secondaryText}</span>
          </div>
        </div>
      `;
    }).join('');

    this.suggestionsContainer.innerHTML = suggestionsHTML;
    this.suggestionsContainer.style.display = 'block';

    // Add click listeners to suggestions
    this.suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        const prediction = predictions[index];
        if (prediction) {
          this.selectSuggestion(prediction);
        }
      });
    });
  }

  /**
   * Add proper spacing to city/state text - LEGACY FUNCTION
   * @param {string} text - Text to fix spacing
   * @returns {string} Text with proper spacing
   * 
   * NOTE: This function was causing spacing issues in address suggestions.
   * It only handles state codes like "AtlantaGA" -> "Atlanta GA" but was being
   * applied to all address text. Now disabled in favor of using raw Google Places data.
   * Keep this function for potential future specific use cases.
   */
  static addSpacingToText(text) {
    if (!text) return '';
    
    console.log('addSpacingToText input:', JSON.stringify(text));
    
    // Simple pattern: any letter followed by exactly 2 capital letters
    // This catches: "SyracuseNY" -> "Syracuse NY", "CityCA" -> "City CA", etc.
    const result = text.replace(/([a-zA-Z])([A-Z]{2})\b/g, '$1 $2');
    
    console.log('addSpacingToText output:', JSON.stringify(result));
    
    return result;
  }

  /**
   * Highlight matching text in suggestions (simplified)
   * @param {string} text - Text to highlight
   * @param {string} query - Search query
   * @returns {string} HTML with highlighted text
   */
  static highlightMatch(text, query) {
    if (!query || !text) return text;
    
    // Just do highlighting, spacing is handled separately now
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
  }

  /**
   * Update suggestion selection highlight
   * @param {number} selectedIndex - Index of selected suggestion
   */
  static updateSuggestionSelection(selectedIndex) {
    AppState.selectedSuggestionIndex = selectedIndex;
    
    if (!this.suggestionsContainer) return;

    // Remove previous selection
    this.suggestionsContainer.querySelectorAll('.suggestion-item').forEach(item => {
      item.classList.remove('selected');
    });

    // Add selection to current item
    if (selectedIndex >= 0) {
      const selectedItem = this.suggestionsContainer.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedItem) {
        selectedItem.classList.add('selected');
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  /**
   * Select a suggestion
   * @param {Object} prediction - Selected place prediction
   */
  static async selectSuggestion(prediction) {
    try {
      // Update search input
      this.searchInput.value = prediction.description;
      
      // Hide suggestions
      this.hideSuggestions();
      
      // Show loading
      this.showLoadingState();
      
      // Get place details
      const placeDetails = await SearchService.getPlaceDetails(prediction.place_id);
      
      // Dispatch selection event
      this.dispatchSearchEvent('suggestion-selected', { 
        prediction, 
        placeDetails 
      });
      
    } catch (error) {
      console.error('Suggestion selection error:', error);
      this.dispatchSearchEvent('search-error', { 
        prediction, 
        error 
      });
    } finally {
      this.hideLoadingState();
    }
  }

  /**
   * Hide search suggestions
   */
  static hideSuggestions() {
    if (this.suggestionsContainer) {
      this.suggestionsContainer.style.display = 'none';
      this.suggestionsContainer.innerHTML = '';
    }
    AppState.selectedSuggestionIndex = -1;
  }

  /**
   * Show loading state in search
   */
  static showLoadingState() {
    if (this.searchButton) {
      this.searchButton.disabled = true;
      this.searchButton.innerHTML = '⏳';
    }
    
    if (this.suggestionsContainer) {
      this.suggestionsContainer.innerHTML = `
        <div class="loading-suggestion">
          <span>🔍 Searching...</span>
        </div>
      `;
      this.suggestionsContainer.style.display = 'block';
    }
  }

  /**
   * Hide loading state
   */
  static hideLoadingState() {
    if (this.searchButton) {
      this.searchButton.disabled = false;
      this.searchButton.innerHTML = '🔍';
    }
  }

  /**
   * Escape special regex characters
   * @param {string} string - String to escape
   * @returns {string} Escaped string
   */
  static escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Dispatch custom search events
   * @param {string} eventName - Event name
   * @param {Object} detail - Event detail data
   */
  static dispatchSearchEvent(eventName, detail) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  /**
   * Clear search input and suggestions
   */
  static clearSearch() {
    if (this.searchInput) {
      this.searchInput.value = '';
    }
    this.hideSuggestions();
    AppState.currentSuggestions = [];
  }

  /**
   * Set search input value
   * @param {string} value - Value to set
   */
  static setSearchValue(value) {
    if (this.searchInput) {
      this.searchInput.value = value;
    }
  }

  /**
   * Get current search value
   * @returns {string} Current search input value
   */
  static getSearchValue() {
    return this.searchInput ? this.searchInput.value.trim() : '';
  }
}

// Export individual functions for backward compatibility
export const displaySuggestions = SearchUI.displaySuggestions.bind(SearchUI);
export const hideSuggestions = SearchUI.hideSuggestions.bind(SearchUI);
export const updateSuggestionSelection = SearchUI.updateSuggestionSelection.bind(SearchUI);
export const handleSearchInput = SearchUI.handleSearchInput.bind(SearchUI);
export const handleKeyDown = SearchUI.handleKeyDown.bind(SearchUI);
export const clearSearch = SearchUI.clearSearch.bind(SearchUI);
export const setSearchValue = SearchUI.setSearchValue.bind(SearchUI);
export const getSearchValue = SearchUI.getSearchValue.bind(SearchUI);