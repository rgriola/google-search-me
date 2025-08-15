/**
 * Admin Filter Manager
 * Handles filtering and display logic for admin panel data
 */

/**
 * Admin Filter Manager Class
 * Manages filtering and display of admin data
 */
export class AdminFilterManager {

  /**
   * Apply user filter to table
   * @param {HTMLElement} modal - Admin modal element
   * @param {string} filter - Filter type
   */
  static applyUserFilter(modal, filter) {
    const userRows = modal.querySelectorAll('#usersTableBody tr');
    let visibleCount = 0;

    userRows.forEach(row => {
      const isAdmin = row.dataset.admin === 'true';
      const isActive = row.dataset.active === 'true';
      let shouldShow = false;

      switch (filter) {
        case 'all':
          shouldShow = true;
          break;
        case 'admin':
          shouldShow = isAdmin;
          break;
        case 'regular':
          shouldShow = !isAdmin;
          break;
        case 'active':
          shouldShow = isActive;
          break;
        case 'inactive':
          shouldShow = !isActive;
          break;
      }

      if (shouldShow) {
        row.classList.remove('hidden');
      } else {
        row.classList.add('hidden');
      }
      if (shouldShow) visibleCount++;
    });

    // Update filter indicator
    this.showFilterIndicator(modal, filter, visibleCount);
  }

  /**
   * Show filter indicator
   * @param {HTMLElement} modal - Admin modal element
   * @param {string} filter - Applied filter
   * @param {number} count - Number of visible items
   */
  static showFilterIndicator(modal, filter, count) {
    let indicator = modal.querySelector('.filter-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'filter-indicator';
      const controls = modal.querySelector('.admin-controls');
      if (controls) {
        controls.appendChild(indicator);
      }
    }

    if (filter === 'all') {
      indicator.textContent = '';
      indicator.classList.add('hidden');
    } else {
      indicator.textContent = `Showing ${count} ${filter} users`;
      indicator.classList.remove('hidden');
    }
  }

  /**
   * Setup filter event listeners
   * @param {HTMLElement} modal - Admin modal element
   */
  static setupFilterListeners(modal) {
    const userFilter = modal.querySelector('#userFilter');
    if (userFilter) {
      userFilter.addEventListener('change', (e) => {
        this.applyUserFilter(modal, e.target.value);
      });
    }
  }
}
