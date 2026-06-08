document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Navbar & Mobile Menu Logic
    const navbar = document.querySelector('.navbar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    let isMenuOpen = false;

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            isMenuOpen = !isMenuOpen;
            if (isMenuOpen) {
                mobileMenu.classList.remove('hidden');
                mobileMenuBtn.innerHTML = '<i data-lucide="x"></i>';
            } else {
                mobileMenu.classList.add('hidden');
                mobileMenuBtn.innerHTML = '<i data-lucide="menu"></i>';
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });

        const mobileLinks = document.querySelectorAll('.mobile-link, .mobile-btn');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                isMenuOpen = false;
                mobileMenu.classList.add('hidden');
                mobileMenuBtn.innerHTML = '<i data-lucide="menu"></i>';
                if (typeof lucide !== 'undefined') lucide.createIcons();
            });
        });
    }

    // 1b. Sticky CTA & Navbar Scroll Logic
    const stickyCta = document.getElementById('sticky-cta');
    const heroSection = document.querySelector('.hero');
    
    const handleScroll = () => {
        // Navbar Scroll
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }

        // Show sticky CTA after scrolling past the hero section
        if (stickyCta && heroSection) {
            if (window.scrollY > heroSection.offsetHeight - 100) {
                stickyCta.classList.add('show');
            } else {
                stickyCta.classList.remove('show');
            }
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // initial check

    // 2. Smooth Scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            
            if(targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 3. FAQ Accordion Logic
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            // Close other open items
            accordionHeaders.forEach(otherHeader => {
                if (otherHeader !== header && otherHeader.classList.contains('active')) {
                    otherHeader.classList.remove('active');
                    otherHeader.nextElementSibling.style.maxHeight = null;
                }
            });

            // Toggle current item
            header.classList.toggle('active');
            const content = header.nextElementSibling;
            
            if (header.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.style.maxHeight = null;
            }
        });
    });

    // 4. Scroll Reveal Animations (fade-in-up)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(element => {
        observer.observe(element);
    });

    // 5. Countdown Timer Logic
    const targetDate = new Date("June 10, 2026 11:00:00").getTime();

    const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            document.getElementById("countdown").innerHTML = "REGISTRATION CLOSED";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const elDays = document.getElementById("days");
        const elHours = document.getElementById("hours");
        const elMinutes = document.getElementById("minutes");
        const elSeconds = document.getElementById("seconds");

        if (elDays) elDays.innerText = days.toString().padStart(2, '0');
        if (elHours) elHours.innerText = hours.toString().padStart(2, '0');
        if (elMinutes) elMinutes.innerText = minutes.toString().padStart(2, '0');
        if (elSeconds) elSeconds.innerText = seconds.toString().padStart(2, '0');
    };

    updateCountdown(); // Run once immediately
    setInterval(updateCountdown, 1000); // Update every second

});
