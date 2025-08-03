/**
 * Dialog Position Manager
 * Handles dialog positioning logic and styling
 */

export class DialogPositionManager {
  
  /**
   * Apply positioning styles to a dialog
   * @param {HTMLElement} dialog - Dialog element
   * @param {string} position - Position type
   */
  static applyPosition(dialog, position) {
    switch (position) {
      case 'top-right':
        return this.applyTopRightPosition(dialog);
      case 'enhanced-center':
        return this.applyEnhancedCenterPosition(dialog);
      case 'center':
      default:
        return this.applyCenterPosition(dialog);
    }
  }

  /**
   * Apply top-right positioning
   * @param {HTMLElement} dialog - Dialog element
   */
  static applyTopRightPosition(dialog) {
    dialog.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      padding: 0;
      max-width: 400px;
      width: 380px;
      z-index: 10000;
      border: 1px solid #e0e0e0;
      animation: slideInFromRight 0.3s ease;
    `;
  }

  /**
   * Apply enhanced center positioning with backdrop
   * @param {HTMLElement} dialog - Dialog element
   */
  static applyEnhancedCenterPosition(dialog) {
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(3px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    backdrop.onclick = (e) => {
      if (e.target === backdrop) {
        document.dispatchEvent(new CustomEvent('closeDialog'));
      }
    };
    
    document.body.appendChild(backdrop);
    backdrop.appendChild(dialog);
    
    // Trigger animation
    setTimeout(() => {
      backdrop.style.opacity = '1';
    }, 10);
    
    return backdrop;
  }

  /**
   * Apply standard center positioning
   * @param {HTMLElement} dialog - Dialog element
   */
  static applyCenterPosition(dialog) {
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
    `;
    
    backdrop.onclick = () => {
      document.dispatchEvent(new CustomEvent('closeDialog'));
    };
    
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      padding: 20px;
      max-width: 500px;
      width: 90%;
      z-index: 10000;
    `;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(dialog);
    
    return backdrop;
  }

  /**
   * Get optimal position based on viewport and content
   * @param {string} preferredPosition - Preferred position
   * @param {Object} contentSize - Content dimensions
   * @returns {string} Optimal position
   */
  static getOptimalPosition(preferredPosition, contentSize = {}) {
    // For now, just return the preferred position
    // In the future, could analyze viewport size and content to optimize
    return preferredPosition;
  }
}
