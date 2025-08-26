import { ProfilePanel } from './ProfilePanel.js';

class LayoutController {
    constructor() {
        this.profilePanel = new ProfilePanel();
        this.buttonStates = {
            profile: false
        };
        
        console.log('🎯 LayoutController initialized');
    }

    initialize() {
        this.setupProfileButton();
        this.setupClickOutside();
        console.log('🎯 Layout controller ready');
    }

    setupProfileButton() {
        const profileButton = document.getElementById('profile-button');
        if (!profileButton) {
            console.warn('Profile button not found');
            return;
        }

        profileButton.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            this.buttonStates.profile = !this.buttonStates.profile;
            const button = profileButton.querySelector('button');
            
            if (this.buttonStates.profile) {
                // Activate button visual state
                button.classList.add('active');
                button.style.background = 'rgba(147, 51, 234, 0.8)';
                
                // Show dynamic profile panel
               // await this.profilePanel.show();
                await this.profilePanel.toggle();
                
                console.log('👤 Profile panel opened');
            } else {
                // Deactivate button visual state
                button.classList.remove('active');
                button.style.background = 'rgba(255, 255, 255, 0.2)';
                
                // Hide profile panel
                //this.profilePanel.hide();
                await this.profilePanel.toggle();
                
                console.log('👤 Profile panel closed');
            }
        });
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
    // Wait a bit for other scripts to load
    setTimeout(() => {
        const layoutController = new LayoutController();
        layoutController.initialize();
    }, 1000);
});