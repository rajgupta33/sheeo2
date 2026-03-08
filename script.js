// Initialize Lucide Icons
lucide.createIcons();

document.addEventListener('DOMContentLoaded', () => {
    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    let isMenuOpen = false;

    mobileMenuBtn.addEventListener('click', () => {
        isMenuOpen = !isMenuOpen;
        if (isMenuOpen) {
            mobileMenu.classList.add('active');
            mobileMenuBtn.innerHTML = '<i data-lucide="x"></i>';
        } else {
            mobileMenu.classList.remove('active');
            mobileMenuBtn.innerHTML = '<i data-lucide="menu"></i>';
        }
        lucide.createIcons();
    });

    // Close Mobile Menu on Link Click
    const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-btn');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            isMenuOpen = false;
            mobileMenu.classList.remove('active');
            mobileMenuBtn.innerHTML = '<i data-lucide="menu"></i>';
            lucide.createIcons();
        });
    });

    // Intersection Observer for Scroll Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: Stop observing once animation has triggered
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in-up, .fade-in-left');
    animatedElements.forEach(el => observer.observe(el));

    // Google Sheets Form Submissions
    function bindGoogleSheetForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Submitting...';
            submitBtn.disabled = true;

            const scriptURL = 'https://script.google.com/macros/s/AKfycbzCOUt2dYnlUaKUsgpjohwOBrk1sX3gO6Gd_2WH5xsPSs2pfcYxiyTPWJ4y0Ora8xQ/exec';

            const payload = {
                firstName: form.firstName ? form.firstName.value : 'N/A',
                lastName: form.lastName ? form.lastName.value : 'N/A',
                contact: form.contact ? form.contact.value : 'N/A',
                message: form.message ? form.message.value : 'N/A'
            };

            fetch(scriptURL, {
                method: 'POST',
                body: JSON.stringify(payload)
            })
                .then(() => {
                    alert('Thank you! Your submission has been received.');
                    form.reset();
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                })
                .catch(error => {
                    console.error('Error!', error.message);
                    alert('Oops! Something went wrong. Please try again.');
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                });
        });
    }

    bindGoogleSheetForm('partner-form');

    // Bind all newsletter forms dynamically since they appear in multiple places
    document.querySelectorAll('.newsletter-form').forEach(form => {
        if (!form.id) form.id = 'newsletter-form-' + Math.random().toString(36).substr(2, 9);
        bindGoogleSheetForm(form.id);
    });
});
