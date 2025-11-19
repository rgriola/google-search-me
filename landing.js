    // page handlers
    const LOGIN_PAGE = '/login.html';
    const REGISTRATION_PAGE = '/registration.html';
    //const HOME_PAGE = '/landing.html';

    // navigation handlers
    const navigationHandlers = () => {
        // Get Started buttons - both hero and plan buttons
        const getStartedButtons = document.querySelectorAll('.primary-cta, .plan-cta.active');
        getStartedButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Get Started clicked - redirecting to registration');
                window.location.href = REGISTRATION_PAGE;
            });
        });

        // Sign In buttons
        const signInButtons = document.querySelectorAll('.secondary-cta');
        signInButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Sign In clicked - redirecting to login');
                window.location.href = LOGIN_PAGE;
            });
        });
    };

    // FAQ Toggle Functionality
    function toggleFaq(button) {
            const faqItem = button.parentElement;
            const isActive = faqItem.classList.contains('active');
            
            // Close all other FAQ items first
            document.querySelectorAll('.faq-item').forEach(item => {
                if (item !== faqItem) {
                    item.classList.remove('active');
                }
            });
            
            // Toggle current item - if it was active, close it; if not, open it
            if (isActive) {
                faqItem.classList.remove('active');
            } else {
                faqItem.classList.add('active');
            }
        }

        // Initialize FAQ event listeners
        function initializeFaq() {
            document.querySelectorAll('.faq-question').forEach(button => {
                button.addEventListener('click', function() {
                    toggleFaq(this);
                });
            });
        }

        // Modal functionality
        function initializeModal() {
            const aboutModal = document.getElementById('aboutModal');
            const aboutLink = document.querySelector('a[href="#about"]');
            const closeModal = document.querySelector('.modal-close');

            // Open modal when About link is clicked
            if (aboutLink) {
                aboutLink.addEventListener('click', function(e) {
                    e.preventDefault();
                    aboutModal.classList.add('show');
                    document.body.classList.add('modal-no-scroll'); // Prevent background scroll
                });
            }

            // Close modal when X is clicked
            if (closeModal) {
                closeModal.addEventListener('click', function() {
                    aboutModal.classList.remove('show');
                    document.body.classList.remove('modal-no-scroll'); // Restore scroll
                });
            }

            // Close modal when clicking outside content
            aboutModal.addEventListener('click', function(e) {
                if (e.target === aboutModal) {
                    aboutModal.classList.remove('show');
                    document.body.classList.remove('modal-no-scroll'); // Restore scroll
                }
            });

            // Close modal with Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && aboutModal.classList.contains('show')) {
                    aboutModal.classList.remove('show');
                    document.body.classList.remove('modal-no-scroll'); // Restore scroll
                }
            });
        }

        // Navigation handlers
        function handleNavigation() {
            // Get Started buttons - both hero and plan buttons
            const getStartedButtons = document.querySelectorAll('.primary-cta, .plan-cta.active');
            getStartedButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('Get Started clicked - redirecting to registration');
                    window.location.href = 'registration.html';
                });
            });

            // Sign In buttons
            const signInButtons = document.querySelectorAll('.secondary-cta');
            signInButtons.forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    console.log('Sign In clicked - redirecting to login');
                    window.location.href = 'login.html';
                });
            });
        }

        // Smooth scrolling for anchor links
        document.addEventListener('DOMContentLoaded', function() {
            // Add smooth scrolling behavior - CSP compliant
            document.documentElement.classList.add('smooth-scroll');
            
            // Initialize navigation handlers
            handleNavigation();
            
            // Initialize FAQ functionality
            initializeFaq();
            
            // Initialize modal functionality
            initializeModal();
            
            // Handle hash navigation for registration
            if (window.location.hash === '#register') {
                // Redirect to registration page
                window.location.href = REGISTRATION_PAGE;
            }
        });