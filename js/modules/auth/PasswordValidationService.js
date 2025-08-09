/**
 * Password Validation Service
 * Centralized password validation logic for all forms
 * Consolidates duplicate validation functions from main.js and AuthHandlers.js
 */

/**
 * Centralized Password Validation Service
 * Single source of truth for all password validation logic
 */
export class PasswordValidationService {

    /**
     * Core password requirements validation
     * Used by all password forms (login, register, reset, change password)
     */
    static validatePasswordRequirements(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const errors = [];
        if (password.length < minLength) errors.push('Password must be at least 8 characters long');
        if (!hasUpperCase) errors.push('Password must contain at least one uppercase letter');
        if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');
        if (!hasNumbers) errors.push('Password must contain at least one number');
        if (!hasSpecialChar) errors.push('Password must contain at least one special character');

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Legacy validatePassword function (compatible with AuthHandlers.js)
     * Alias for validatePasswordRequirements for backward compatibility
     */
    static validatePassword(password) {
        return this.validatePasswordRequirements(password);
    }

    /**
     * Password matching validation
     * Ensures two passwords match exactly
     */
    static validatePasswordMatch(password1, password2) {
        const match = password1 === password2 && password1 !== '';
        return {
            isValid: match,
            error: match ? null : 'Passwords do not match'
        };
    }

    /**
     * Enhanced password strength analysis with security checking
     * Moved from main.js setupChangePasswordHandler
     */
    static analyzePasswordStrength(password) {
        let score = 0;
        let feedback = [];
        let entropy = 0;
        let securityWarnings = [];
        
        // Character set size calculation for entropy
        let charsetSize = 0;
        if (/[a-z]/.test(password)) charsetSize += 26;
        if (/[A-Z]/.test(password)) charsetSize += 26;
        if (/\d/.test(password)) charsetSize += 10;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) charsetSize += 32;
        
        // Calculate entropy (bits of randomness)
        if (password.length > 0 && charsetSize > 0) {
            entropy = Math.log2(Math.pow(charsetSize, password.length));
        }
        
        // Security check
        const securityCheck = PasswordValidationService.checkPasswordSecurity(password);
        
        // Length scoring (more granular)
        if (password.length >= 16) score += 35;
        else if (password.length >= 14) score += 32;
        else if (password.length >= 12) score += 30;
        else if (password.length >= 10) score += 25;
        else if (password.length >= 8) score += 20;
        else if (password.length >= 6) score += 10;
        else if (password.length >= 4) score += 5;
        
        if (password.length < 8) feedback.push('At least 8 characters');
        
        // Character variety scoring
        if (/[A-Z]/.test(password)) score += 15;
        else feedback.push('uppercase letter');
        
        if (/[a-z]/.test(password)) score += 15;
        else feedback.push('lowercase letter');
        
        if (/\d/.test(password)) score += 15;
        else feedback.push('number');
        
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;
        else feedback.push('special character');
        
        // Bonus points for complexity patterns
        if (password.length >= 12) score += 5; // Length bonus
        if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password)) score += 5; // All types
        if (entropy >= 70) score += 5; // High entropy bonus
        
        // Security penalties
        if (securityCheck.isCommon) {
            score -= 30;
            securityWarnings.push('This password appears in breach databases');
        }
        
        if (securityCheck.hasCommonPatterns) {
            score -= 15;
            securityWarnings.push('Avoid common password patterns');
        }
        
        // Pattern penalties
        if (/(.)\1{2,}/.test(password)) {
            score -= 10;
            securityWarnings.push('Avoid repeated characters');
        }
        
        if (/123|234|345|456|567|678|789|890|abc|bcd|cde|def/.test(password.toLowerCase())) {
            score -= 10;
            securityWarnings.push('Avoid sequential characters');
        }
        
        // Ensure score doesn't go below 0 or above 100
        score = Math.max(0, Math.min(100, score));
        
        // Determine strength level with more granular categories
        let strength = 'very weak';
        let color = '#dc3545';
        
        if (score >= 90 && securityCheck.isSecure) {
            strength = 'excellent';
            color = '#28a745';
        } else if (score >= 80) {
            strength = 'strong';
            color = '#20c997';
        } else if (score >= 70) {
            strength = 'good';
            color = '#28a745';
        } else if (score >= 60) {
            strength = 'fair';
            color = '#ffc107';
        } else if (score >= 40) {
            strength = 'weak';
            color = '#fd7e14';
        } else if (score >= 20) {
            strength = 'poor';
            color = '#dc3545';
        }
        
        return { score, strength, color, feedback, entropy, securityWarnings };
    }

    /**
     * Password security checking (breach detection simulation)
     * Moved from main.js setupChangePasswordHandler
     */
    static checkPasswordSecurity(password) {
        // Common compromised passwords (simplified simulation)
        const commonPasswords = [
            'password', '123456', 'password123', 'admin', 'qwerty', 'letmein',
            '123456789', 'welcome', 'monkey', '1234567890', 'abc123',
            'Password1', 'password1', '12345678', 'sunshine', 'master',
            'login', 'passw0rd', 'football', 'baseball', 'superman'
        ];
        
        // Check if password appears in common breach list
        const isCommon = commonPasswords.some(common => 
            password.toLowerCase().includes(common.toLowerCase()) ||
            common.toLowerCase().includes(password.toLowerCase())
        );
        
        // Check for common patterns that might be in breaches
        const hasCommonPatterns = [
            /^[a-zA-Z]+\d+$/, // Letters followed by numbers
            /^\d+[a-zA-Z]+$/, // Numbers followed by letters
            /^[a-zA-Z]+\d+[!@#$%^&*]$/, // Letters, numbers, single special char
            /password/i, /admin/i, /user/i, /test/i
        ].some(pattern => pattern.test(password));
        
        return {
            isCommon,
            hasCommonPatterns,
            isSecure: !isCommon && !hasCommonPatterns && password.length >= 12
        };
    }

    /**
     * Real-time password validation for UI feedback
     * Combines requirements check with strength analysis
     */
    static validatePasswordRealTime(password) {
        const requirements = this.validatePasswordRequirements(password);
        const strength = this.analyzePasswordStrength(password);
        
        return {
            ...requirements,
            strength,
            isStrong: strength.score >= 70 && requirements.isValid
        };
    }

    /**
     * Complete form validation for password change forms
     * Validates current password, new password, and confirmation
     */
    static validatePasswordChangeForm(currentPassword, newPassword, confirmPassword) {
        const currentValid = this.validatePasswordRequirements(currentPassword);
        const newValid = this.validatePasswordRequirements(newPassword);
        const passwordsMatch = this.validatePasswordMatch(newPassword, confirmPassword);
        const passwordsDifferent = currentPassword !== newPassword && newPassword !== '';

        const isValid = currentValid.isValid && 
                        newValid.isValid && 
                        passwordsMatch.isValid && 
                        passwordsDifferent;

        return {
            isValid,
            currentPasswordValid: currentValid.isValid,
            newPasswordValid: newValid.isValid,
            passwordsMatch: passwordsMatch.isValid,
            passwordsDifferent,
            errors: {
                current: currentValid.errors,
                new: newValid.errors,
                match: passwordsMatch.error,
                different: !passwordsDifferent ? 'New password must be different from current password' : null
            }
        };
    }

    /**
     * Update password requirements visual indicators
     * For use with password strength UI components
     */
    static updateRequirementIndicators(password, containerSelector = null) {
        const requirements = [
            { id: 'req-length', test: password.length >= 8 },
            { id: 'req-uppercase', test: /[A-Z]/.test(password) },
            { id: 'req-lowercase', test: /[a-z]/.test(password) },
            { id: 'req-number', test: /\d/.test(password) },
            { id: 'req-special', test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) }
        ];

        requirements.forEach(req => {
            const selector = containerSelector ? `${containerSelector} #${req.id}` : `#${req.id}`;
            const element = document.querySelector(selector);
            if (element) {
                const icon = element.querySelector('.requirement-icon');
                if (req.test) {
                    element.classList.add('met');
                    element.classList.remove('unmet');
                    if (icon) icon.textContent = '✅';
                } else {
                    element.classList.add('unmet');
                    element.classList.remove('met');
                    if (icon) icon.textContent = '⚪';
                }
            }
        });
    }
}

// Export convenience functions for direct import
export const validatePasswordRequirements = PasswordValidationService.validatePasswordRequirements.bind(PasswordValidationService);
export const validatePassword = PasswordValidationService.validatePassword.bind(PasswordValidationService);
export const validatePasswordMatch = PasswordValidationService.validatePasswordMatch.bind(PasswordValidationService);
export const analyzePasswordStrength = PasswordValidationService.analyzePasswordStrength.bind(PasswordValidationService);
export const validatePasswordRealTime = PasswordValidationService.validatePasswordRealTime.bind(PasswordValidationService);
export const validatePasswordChangeForm = PasswordValidationService.validatePasswordChangeForm.bind(PasswordValidationService);
