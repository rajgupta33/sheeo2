document.addEventListener("DOMContentLoaded", () => {
  const eventTime = new Date("2026-10-10T12:00:00+04:00").getTime();

  function updateCountdown() {
    const distance = eventTime - Date.now();
    const countdown = document.getElementById("countdown");
    if (!countdown) return;
    if (distance <= 0) {
      countdown.innerHTML = '<p class="cp-countdown__closed">This event has now taken place</p>';
      return;
    }
    const units = {
      days: Math.floor(distance / 86400000),
      hours: Math.floor((distance % 86400000) / 3600000),
      minutes: Math.floor((distance % 3600000) / 60000),
      seconds: Math.floor((distance % 60000) / 1000)
    };
    Object.entries(units).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = String(value).padStart(2, "0");
    });
  }

  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  document.querySelectorAll(".cp-faq__question").forEach((button) => {
    button.addEventListener("click", () => {
      const opening = button.getAttribute("aria-expanded") !== "true";
      document.querySelectorAll(".cp-faq__question").forEach((item) => item.setAttribute("aria-expanded", "false"));
      button.setAttribute("aria-expanded", String(opening));
    });
  });

  const revealItems = document.querySelectorAll(".cp-reveal:not(.is-visible)");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const sticky = document.querySelector(".cp-sticky");
  const hero = document.querySelector(".cp-hero");
  if (sticky && hero) {
    const toggleSticky = () => sticky.classList.toggle("is-visible", window.scrollY > hero.offsetHeight * 0.65);
    window.addEventListener("scroll", toggleSticky, { passive: true });
    toggleSticky();
  }

  if (window.lucide) window.lucide.createIcons();
});
