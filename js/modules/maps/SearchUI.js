/**
 * Search UI management
 * Handles search input, suggestions display, and keyboard navigation
 */

import { AppState, StateManager } from '../state/AppState.js';
import { SearchService } from './SearchService.js';
import { SecurityUtils } from '../../utils/SecurityUtils.js';

import { debug, DEBUG } from '../../debug.js';
const FILE = 'SEARCH_UI';

/**
 * Search UI Class
 */
export class SearchUI {

  /**
   * Initialize search UI components
   */
  static initialize() {
    debug(FILE, '🎨 Initializing Search UI');
    
    // Try to setup elements immediately
    let elementsSetup = this.setupSearchElements();
    
    // If elements not found, try again after a short delay
    if (!elementsSetup) {
      debug(FILE, '⚠️ Search elements not found, retrying in 100ms...', null, 'warn');
      setTimeout(() => {
        elementsSetup = this.setupSearchElements();
        if (elementsSetup) {
          this.setupEventListeners();
          debug(FILE, '✅ Initialized (delayed)');
        } else {
          debug(FILE, '❌ Initialization failed - elements still not found', null, 'error');
        }
      }, 100);
      return false;
    }
    
    this.setupEventListeners();
    
    debug(FILE, '✅ Search UI initialized');
    return true;
  }

  /**
   * Setup search DOM elements
   */
  static setupSearchElements() {
    this.searchInput = document.getElementById('searchInput');
    this.searchButton = document.getElementById('searchButton');
    this.suggestionsContainer = document.getElementById('suggestions');
    
    debug(FILE, '🔍 searchInput:', this.searchInput);
    debug(FILE, '🔍 searchButton:', this.searchButton);
    debug(FILE, '🔍 suggestionsContainer:', this.suggestionsContainer);
    
    if (!this.searchInput || !this.searchButton) {
      debug(FILE, 'Elements Missin in DOM', null, 'warn');
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
      debug(FILE, '❌ setupEventListeners - Missing search elements', null, 'error');
      return;
    }

    debug(FILE, '✅ SearchUI setupEventListeners - Attaching event listeners to:', this.searchInput);

    // Search input events
    this.searchInput.addEventListener('input', this.handleSearchInput.bind(this));
    this.searchInput.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.searchInput.addEventListener('focus', this.handleSearchFocus.bind(this));
    this.searchInput.addEventListener('blur', this.handleSearchBlur.bind(this));

    // Search button event
    this.searchButton.addEventListener('click', this.handleSearchSubmit.bind(this));

    debug(FILE, '✅ SearchUI setupEventListeners - All event listeners attached');

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
    debug(FILE, '🔍 SearchUI handleSearchInput called with query:', query);
    
    if (query.length < 2) {
      this.hideSuggestions();
      AppState.currentSuggestions = [];
      return;
    }

    try {
      // Show subtle loading indicator
      this.showLoadingState();
      
      debug(FILE, '🔍 SearchUI calling SearchService.getPlacePredictions with:', query);
      // Get place predictions (now with debouncing built-in)
      const predictions = await SearchService.getPlacePredictions(query);
      debug(FILE, '🔍 SearchUI received predictions:', predictions);
      
      // Update state
      AppState.currentSuggestions = predictions;
      AppState.selectedSuggestionIndex = -1;
      
      // Display suggestions
      this.displaySuggestions(predictions);
      
    } catch (error) {
      debug(FILE, 'Search input error:', error, 'error');
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
      debug(FILE, 'Search submit error:', error, 'error');
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
      
      debug(FILE, 'Suggestion data (raw):');
      debug(FILE, 'mainText:', JSON.stringify(mainText));
      debug(FILE, 'secondaryText:', JSON.stringify(secondaryText));
      debug(FILE, 'description:', JSON.stringify(description));
      
      return `
        <div class="suggestion-item ${isSelected ? 'selected' : ''}" 
             data-place-id="${SecurityUtils.escapeHtmlAttribute(prediction.place_id)}" 
             data-index="${SecurityUtils.escapeHtmlAttribute(index.toString())}">
          <div class="suggestion-main">
            <span class="suggestion-name">${this.highlightMatch(mainText, this.searchInput.value)}</span>
          </div>
          <div class="suggestion-secondary">
            <span class="suggestion-description">${SecurityUtils.escapeHtml(secondaryText)}</span>
          </div>
        </div>
      `;
    }).join('');

    SecurityUtils.setSafeHTML(this.suggestionsContainer, suggestionsHTML);
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
    
    debug(FILE, 'addSpacingToText input:', JSON.stringify(text));
    
    // Simple pattern: any letter followed by exactly 2 capital letters
    // This catches: "SyracuseNY" -> "Syracuse NY", "CityCA" -> "City CA", etc.
    const result = text.replace(/([a-zA-Z])([A-Z]{2})\b/g, '$1 $2');
    
    debug(FILE, 'addSpacingToText output:', JSON.stringify(result));
    
    return result;
  }

  /**
   * Highlight matching text in suggestions (simplified)
   * @param {string} text - Text to highlight
   * @param {string} query - Search query
   * @returns {string} HTML with highlighted text
   */
  static highlightMatch(text, query) {
    if (!query || !text) return SecurityUtils.escapeHtml(text);
    
    // Escape both text and query first for security
    const escapedText = SecurityUtils.escapeHtml(text);
    const escapedQuery = SecurityUtils.escapeHtml(query);
    
    // Then do highlighting on the escaped text
    const regex = new RegExp(`(${this.escapeRegex(escapedQuery)})`, 'gi');
    return escapedText.replace(regex, '<strong>$1</strong>');
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
      debug(FILE, 'Suggestion selection error:', error, 'error');
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
      SecurityUtils.setSafeHTML(this.suggestionsContainer, '');
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
      SecurityUtils.setSafeHTML(this.suggestionsContainer, `
        <div class="loading-suggestion">
          <span>🔍 Searching...</span>
        </div>
      `);
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