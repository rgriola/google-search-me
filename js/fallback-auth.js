/**
 * Fallback login functionality
 * This script provides basic login capability if the modules fail to load
 */

// Import Auth module for centralized token management
import { Auth } from './modules/auth/Auth.js';

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Fallback login script loaded');
    
    // Wait a bit for modules to load, then check if login functionality exists
    setTimeout(function() {
        setupFallbackLogin();
    }, 3000);
});

function setupFallbackLogin() {
    // Check if modules loaded properly
    if (typeof window.Auth !== 'undefined' && window.Auth.showLoginModal) {
        console.log('✅ Main modules loaded successfully');
        return;
    }
    
    console.log('⚠️ Main modules not loaded, setting up fallback login');
    
    // Setup basic login functionality
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            showFallbackLoginModal();
        });
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            showFallbackRegisterModal();
        });
    }
}

function showFallbackLoginModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('fallbackAuthModal');
    if (!modal) {
        modal = createFallbackModal();
    }
    
    // Show login form
    modal.style.display = 'block';
    document.getElementById('fallbackLoginForm').style.display = 'block';
    document.getElementById('fallbackRegisterForm').style.display = 'none';
}

function showFallbackRegisterModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('fallbackAuthModal');
    if (!modal) {
        modal = createFallbackModal();
    }
    
    // Show register form
    modal.style.display = 'block';
    document.getElementById('fallbackLoginForm').style.display = 'none';
    document.getElementById('fallbackRegisterForm').style.display = 'block';
}

function createFallbackModal() {
    const modal = document.createElement('div');
    modal.id = 'fallbackAuthModal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        z-index: 10000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.5);
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            margin: 10% auto;
            padding: 20px;
            border-radius: 8px;
            width: 400px;
            max-width: 90%;
            position: relative;
        ">
            <span style="
                position: absolute;
                right: 15px;
                top: 15px;
                font-size: 24px;
                cursor: pointer;
            " data-action="close-modal">&times;</span>
            
            <!-- Login Form -->
            <div id="fallbackLoginForm">
                <h2>Login</h2>
                <form id="fallbackLoginFormElement">
                    <div style="margin-bottom: 15px;">
                        <label>Email:</label><br>
                        <input type="email" id="fallbackLoginEmail" value="rodczaro@gmail.com" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label>Password:</label><br>
                        <input type="password" id="fallbackLoginPassword" value="Dakota1973$$" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <button type="submit" style="background: #4285f4; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; width: 100%;">Login</button>
                </form>
                <p style="text-align: center; margin-top: 15px;">
                    <a href="#" data-action="show-register">Don't have an account? Register</a>
                </p>
            </div>
            
            <!-- Register Form -->
            <div id="fallbackRegisterForm" style="display: none;">
                <h2>Register</h2>
                <form id="fallbackRegisterFormElement">
                    <div style="margin-bottom: 10px;">
                        <label>Email:</label><br>
                        <input type="email" id="fallbackRegisterEmail" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label>First Name:</label><br>
                        <input type="text" id="fallbackRegisterFirstName" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label>Last Name:</label><br>
                        <input type="text" id="fallbackRegisterLastName" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="margin-bottom: 10px;">
                        <label>Password:</label><br>
                        <input type="password" id="fallbackRegisterPassword" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label>Confirm Password:</label><br>
                        <input type="password" id="fallbackRegisterConfirmPassword" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <button type="submit" style="background: #4285f4; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; width: 100%;">Register</button>
                </form>
                <p style="text-align: center; margin-top: 15px;">
                    <a href="#" data-action="show-login">Already have an account? Login</a>
                </p>
            </div>
            
            <div id="fallbackMessage" style="margin-top: 15px; padding: 10px; border-radius: 4px; display: none;"></div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup form handlers
    document.getElementById('fallbackLoginFormElement').addEventListener('submit', handleFallbackLogin);
    document.getElementById('fallbackRegisterFormElement').addEventListener('submit', handleFallbackRegister);
    
    return modal;
}

async function handleFallbackLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('fallbackLoginEmail').value;
    const password = document.getElementById('fallbackLoginPassword').value;
    const messageDiv = document.getElementById('fallbackMessage');
    
    try {
        messageDiv.style.display = 'block';
        messageDiv.style.background = '#ffeaa7';
        messageDiv.style.color = '#856404';
        messageDiv.textContent = 'Logging in...';
        
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store auth data using centralized method
            Auth.setToken(data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            messageDiv.style.background = '#d4edda';
            messageDiv.style.color = '#155724';
            messageDiv.innerHTML = `
                <strong>Login Successful!</strong><br>
                Welcome, ${data.user.firstName} ${data.user.lastName}!
            `;
            
            // Update UI
            updateFallbackAuthUI(data.user);
            
            // Close modal after 2 seconds
            setTimeout(() => {
                document.getElementById('fallbackAuthModal').style.display = 'none';
            }, 2000);
            
        } else {
            throw new Error(data.error || 'Login failed');
        }
        
    } catch (error) {
        messageDiv.style.display = 'block';
        messageDiv.style.background = '#f8d7da';
        messageDiv.style.color = '#721c24';
        messageDiv.textContent = `Login failed: ${error.message}`;
    }
}

async function handleFallbackRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('fallbackRegisterEmail').value;
    const firstName = document.getElementById('fallbackRegisterFirstName').value;
    const lastName = document.getElementById('fallbackRegisterLastName').value;
    const password = document.getElementById('fallbackRegisterPassword').value;
    const confirmPassword = document.getElementById('fallbackRegisterConfirmPassword').value;
    const messageDiv = document.getElementById('fallbackMessage');
    
    if (password !== confirmPassword) {
        messageDiv.style.display = 'block';
        messageDiv.style.background = '#f8d7da';
        messageDiv.style.color = '#721c24';
        messageDiv.textContent = 'Passwords do not match';
        return;
    }
    
    try {
        messageDiv.style.display = 'block';
        messageDiv.style.background = '#ffeaa7';
        messageDiv.style.color = '#856404';
        messageDiv.textContent = 'Creating account...';
        
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email, 
                firstName, 
                lastName, 
                password,
                username: email 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            messageDiv.style.background = '#d4edda';
            messageDiv.style.color = '#155724';
            messageDiv.innerHTML = `
                <strong>Registration Successful!</strong><br>
                Account created for ${firstName} ${lastName}
            `;
            
            // Switch to login form after 2 seconds
            setTimeout(() => {
                showFallbackLoginModal();
            }, 2000);
            
        } else {
            throw new Error(data.error || 'Registration failed');
        }
        
    } catch (error) {
        messageDiv.style.display = 'block';
        messageDiv.style.background = '#f8d7da';
        messageDiv.style.color = '#721c24';
        messageDiv.textContent = `Registration failed: ${error.message}`;
    }
}

function updateFallbackAuthUI(user) {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    
    if (authButtons) {
        authButtons.classList.add('auth-buttons-hidden');
        authButtons.classList.remove('auth-buttons-visible');
    }
    
    if (userInfo) {
        userInfo.classList.remove('hidden');
        userInfo.classList.add('user-info-visible');
        
        const welcomeText = document.getElementById('welcomeText');
        if (welcomeText) {
            welcomeText.textContent = `Welcome, ${user.firstName}!`;
        }
    }
}

/**
 * Setup secure event delegation for fallback auth actions
 * Replaces inline onclick handlers with secure event delegation
 */
function setupFallbackAuthEventDelegation() {
    // Remove any existing listener to prevent duplicates
    document.removeEventListener('click', handleFallbackAuthDelegatedClick);
    
    // Add new secure event delegation
    document.addEventListener('click', handleFallbackAuthDelegatedClick);
    
    console.log('✅ Fallback auth event delegation setup complete');
}

/**
 * Handle delegated click events for fallback auth
 */
function handleFallbackAuthDelegatedClick(event) {
    const action = event.target.getAttribute('data-action');
    
    if (action) {
        event.preventDefault();
        
        switch (action) {
            case 'close-modal':
                const modal = document.getElementById('fallbackAuthModal');
                if (modal) {
                    modal.style.display = 'none';
                }
                break;
                
            case 'show-register':
                showFallbackRegisterModal();
                break;
                
            case 'show-login':
                showFallbackLoginModal();
                break;
        }
    }
}

// Initialize event delegation when module loads
setupFallbackAuthEventDelegation();

// Make functions globally available
window.showFallbackLoginModal = showFallbackLoginModal;
window.showFallbackRegisterModal = showFallbackRegisterModal;
