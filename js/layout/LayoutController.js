import { ProfilePanel } from './ProfilePanel.js';


class LayoutController {
    constructor() {
        this.profilePanel = new ProfilePanel();
        this.buttonStates = {
            profile: false
        };
        this.profileButtonInitialized = false; // Track if profile button is already setup
        
        console.log('🎯 LayoutController initialized');
    }
    
    initialize() {
        this.setupProfileButton();
        //this.setupClickOutside();
        console.log('🎯 Layout controller ready');
    }

    setupProfileButton() {
        const profileButton = document.getElementById('profile-button');
        if (!profileButton) {
            console.warn('❌ Profile button not found');
            return;
        }

        // Prevent multiple event listeners on the same button
        if (this.profileButtonInitialized) {
            console.log('⚠️ Profile button already initialized, skipping duplicate setup');
            return;
        }

        console.log('🔗 Setting up profile button click handler in LayoutController');

        // Add our handler with capture to ensure we get it first
        profileButton.addEventListener('click', async (e) => {

            console.log('👆 Profile button clicked, handled by LayoutController');
            
            // Stop event propagation to prevent test-layout-control-buttons.js from also handling it
            e.stopPropagation();
            e.preventDefault();
            
            const button = profileButton.querySelector('button');
            
            // Check actual DOM state instead of ProfilePanel's internal tracking
            const profilePanel = document.getElementById('profile-panel');
            //const wasVisible = profilePanel && profilePanel.children.length > 0 && profilePanel.style.display !== 'none';
            
            // Toggle the panel
            await this.profilePanel.toggle();
            
            // Check new state after toggle (based on actual DOM)
            const isNowVisible = profilePanel && profilePanel.children.length > 0 && profilePanel.style.display !== 'none';
            this.buttonStates.profile = isNowVisible;
            
            if (isNowVisible) {
                // Activate button visual state
                button.classList.add('active');
                button.style.background = 'rgba(147, 51, 234, 0.8)';
                console.log('👤 Profile panel opened');
            } else {
                // Deactivate button visual state
                button.classList.remove('active');
                button.style.background = 'rgba(255, 255, 255, 0.2)';
                console.log('👤 Profile panel closed');
            }
        }, true); // Use capture phase
        
        this.profileButtonInitialized = true;
        console.log('✅ Profile button event listener added');
    }


    setupClickOutside() {
        document.addEventListener('click', (e) => {
            const profileButton = document.getElementById('profile-button');
            const dynamicPanel = document.querySelector('.dynamic-profile-panel');
            
            if (this.buttonStates.profile && 
                profileButton && !profileButton.contains(e.target) &&
                (!dynamicPanel || !dynamicPanel.contains(e.target))) {
                
                // Close profile panel
                this.buttonStates.profile = false;
                const button = profileButton.querySelector('button');
                if (button) {
                    button.classList.remove('active');
                    button.style.background = 'rgba(255, 255, 255, 0.2)';
                }
                this.profilePanel.hide();
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing LayoutController immediately...');
        window.layoutController = new LayoutController();
        window.layoutController.initialize();
        
        // Make the setupProfileButton method accessible globally for debugging
        window.setupProfileButtonHandler = function() {
            console.log('🛠️ Manual profile button setup triggered');
            if (window.layoutController) {
                window.layoutController.setupProfileButton();
                return '✅ Profile button handler refreshed';
            }
            return '❌ LayoutController not available';
        };
        
        console.log('✅ LayoutController initialized and ready');    // Additionally, ensure profile button is properly setup after other scripts load
    setTimeout(() => {
        console.log('🔄 Refreshing profile button setup...');
        if (window.layoutController) {
            window.layoutController.setupProfileButton();
        }
    }, 500);
});