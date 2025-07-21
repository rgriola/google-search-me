
// Debug GPS Button
function debugGPSButton() {
    const button = document.getElementById('gpsLocationBtn');
    if (button) {
        console.log('✅ GPS Button found!');
        console.log('Button element:', button);
        console.log('Button text:', button.textContent);
        console.log('Button title:', button.title);
        console.log('Button style display:', getComputedStyle(button).display);
        console.log('Button style visibility:', getComputedStyle(button).visibility);
        console.log('Button parent:', button.parentElement);
        console.log('Button position in DOM:', button.getBoundingClientRect());
        
        // Check if click handler is attached
        const events = getEventListeners ? getEventListeners(button) : 'Event listeners not available';
        console.log('Event listeners:', events);
        
        return button;
    } else {
        console.log('❌ GPS Button NOT found');
        console.log('Available buttons:', document.querySelectorAll('button'));
        return null;
    }
}

// Run after page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', debugGPSButton);
} else {
    debugGPSButton();
}

