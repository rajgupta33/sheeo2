/*
  SheEO global shell — single source of truth for the site header, footer,
  mobile navigation, navbar scroll state and the floating WhatsApp button.

  Usage on a page:
    <div data-global-header></div>  … somewhere near the top of <body>
    <div data-global-footer></div>  … just before </body>
    <script defer src="/assets/js/global-shell.js"></script>

  The script is defensive: it runs at most once, tolerates a missing slot,
  and never assumes Lucide has finished loading.
*/
(() => {
  if (window.__sheeoShellLoaded) return;
  window.__sheeoShellLoaded = true;

  const MEMBER_LOGIN_URL = "https://members.sheeo-summit.com/portal/";
  const JOIN_URL = "/apply-directory/?type=membership";

  const header = `
    <nav class="navbar" aria-label="Primary navigation">
      <div class="container nav-content">
        <div class="logo-container">
          <a href="/" aria-label="SheEO home" style="text-decoration:none">
            <img src="/sh-logo.jpeg" alt="SheEO Logo" class="brand-logo"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
            <span class="fallback-logo" style="display:none">
              <span class="logo-circle"><span class="logo-bold">She<span class="italic text-rose">EO</span></span></span>
            </span>
          </a>
        </div>
        <div class="nav-links hidden-mobile">
          <a href="/about/" class="nav-link">About</a>
          <div class="relative group">
            <button class="nav-link flex align-center gap-xs cursor-pointer border-none bg-transparent" type="button" style="font-family:inherit">Offerings <i data-lucide="chevron-down" class="icon-xs"></i></button>
            <div class="group-hover-block absolute top-100 left-0 bg-white shadow-pink hidden pt-sm pb-sm" style="min-width:220px;border-radius:12px;z-index:50;top:100%">
              <a href="/events/" class="block px-md py-xs text-dark-blue text-sm hover-text-rose hover-bg-pink-light" style="text-decoration:none;font-weight:600">Events</a>
              <a href="/network-marketing/" class="block px-md py-xs text-dark-blue text-sm hover-text-rose hover-bg-pink-light" style="text-decoration:none;font-weight:600">Network Marketing</a>
              <a href="/group-meetups/" class="block px-md py-xs text-dark-blue text-sm hover-text-rose hover-bg-pink-light" style="text-decoration:none;font-weight:600">Group Meetups</a>
              <a href="/business-support/" class="block px-md py-xs text-dark-blue text-sm hover-text-rose hover-bg-pink-light" style="text-decoration:none;font-weight:600">Business Support</a>
              <a href="/podcast-pr/" class="block px-md py-xs text-dark-blue text-sm hover-text-rose hover-bg-pink-light" style="text-decoration:none;font-weight:600">Podcast &amp; PR</a>
              <a href="/collaborations/" class="block px-md py-xs text-dark-blue text-sm hover-text-rose hover-bg-pink-light" style="text-decoration:none;font-weight:600">Collaborations</a>
            </div>
          </div>
          <a href="/business-support/" class="nav-link">Business Support</a>
          <a href="/directory/" class="nav-link">Business Directory</a>
          <a href="${MEMBER_LOGIN_URL}" class="nav-link nav-auth-link">Member Login</a>
          <a href="${JOIN_URL}" class="btn btn-primary btn-sm rounded-pill">Join Us</a>
        </div>
        <button id="mobile-menu-btn" class="menu-btn mobile-only" type="button" aria-label="Open navigation" aria-controls="mobile-menu" aria-expanded="false"><i data-lucide="menu"></i></button>
      </div>
      <div id="mobile-menu" class="mobile-menu hidden">
        <div class="mobile-menu-content bg-cream px-lg py-xl text-center" style="max-height:90vh;overflow-y:auto">
          <a href="/about/" class="mobile-link block py-sm uppercase tracking-wide font-bold text-dark-blue border-b border-pink-light" style="text-decoration:none">About</a>
          <a href="/events/" class="mobile-link block py-sm uppercase tracking-wide font-bold text-dark-blue border-b border-pink-light" style="text-decoration:none">Events</a>
          <a href="/network-marketing/" class="mobile-link block py-sm uppercase tracking-wide font-bold text-dark-blue border-b border-pink-light" style="text-decoration:none">Network Marketing</a>
          <a href="/group-meetups/" class="mobile-link block py-sm uppercase tracking-wide font-bold text-dark-blue border-b border-pink-light" style="text-decoration:none">Group Meetups</a>
          <a href="/business-support/" class="mobile-link block py-sm uppercase tracking-wide font-bold text-dark-blue border-b border-pink-light" style="text-decoration:none">Business Support</a>
          <a href="/podcast-pr/" class="mobile-link block py-sm uppercase tracking-wide font-bold text-dark-blue border-b border-pink-light" style="text-decoration:none">Podcast &amp; PR</a>
          <a href="/collaborations/" class="mobile-link block py-sm uppercase tracking-wide font-bold text-dark-blue border-b border-pink-light" style="text-decoration:none">Collaborations</a>
          <a href="/directory/" class="mobile-link block py-sm uppercase tracking-wide font-bold text-dark-blue border-b border-pink-light" style="text-decoration:none">Business Directory</a>
          <a href="${MEMBER_LOGIN_URL}" class="mobile-link block py-sm uppercase tracking-wide font-bold text-rose border-b border-pink-light" style="text-decoration:none">Member Login</a>
          <a href="${JOIN_URL}" class="btn btn-primary-pink btn-lg rounded-pill mt-lg w-100">Apply to Join</a>
        </div>
      </div>
    </nav>`;

  const igPermalinks = [
    "https://www.instagram.com/reel/DVQ9cu0At34/",
    "https://www.instagram.com/reel/DUqinRAiS3Y/",
    "https://www.instagram.com/p/DUTjkHtFXGu/",
    "https://www.instagram.com/reel/DTssNzRjz2k/"
  ];

  const igSlides = igPermalinks.map((url) => `
            <div class="ig-slide" style="flex:0 0 clamp(220px,60vw,350px);scroll-snap-align:start;display:flex;justify-content:center">
              <div class="ig-embed-wrapper" style="width:100%">
                <blockquote class="instagram-media" data-instgrm-permalink="${url}?utm_source=ig_embed&amp;utm_campaign=loading" data-instgrm-version="14" style="background:#FFF;border:0;border-radius:3px;box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15);margin:1px;max-width:540px;min-width:240px;padding:0;width:100%">
                  <div style="padding:16px"><a href="${url}?utm_source=ig_embed&amp;utm_campaign=loading" target="_blank" rel="noopener" style="background:#FFFFFF;line-height:0;padding:0;text-align:center;text-decoration:none;width:100%">View this post on Instagram</a></div>
                </blockquote>
              </div>
            </div>`).join("");

  const footer = `
    <footer class="site-footer bg-cream">
      <div class="bg-pink-soft py-xl text-center border-b border-pink-light">
        <div class="container max-w-lg mx-auto"><i data-lucide="heart" class="text-rose icon-sm mb-sm"></i><h4 class="font-playfair text-xl text-dark-blue mb-xs">Built With Vision By SheEO Summit</h4><p class="text-rose text-xs uppercase tracking-wide font-bold">Empowering Women Through Visibility, Community &amp; Collaboration.</p></div>
      </div>
      <div class="container text-center pt-xl mb-xl">
        <p class="text-xs uppercase tracking-wide text-dark-blue font-bold mb-xs">Find us on IG</p>
        <h2 class="font-playfair text-dark-blue mb-lg" style="font-size:3rem"><a href="https://www.instagram.com/sheeosummit2026/" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">@<span class="text-rose">SHEEOSUMMIT</span>2026</a></h2>

        <div class="ig-slider-container relative mb-xl mx-auto" style="max-width:1200px;padding:0 44px">
          <button class="ig-slider-btn prev shadow-pink flex-center" type="button" aria-label="Previous" onclick="document.getElementById('ig-track').scrollBy({left:-350,behavior:'smooth'})" style="position:absolute;top:50%;left:0;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;background:#ebd8dd;border:none;z-index:10;cursor:pointer"><i data-lucide="chevron-left" class="icon-sm text-dark-blue"></i></button>
          <div id="ig-track" class="ig-slider-track flex gap-md" style="overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:none;-ms-overflow-style:none">${igSlides}
          </div>
          <button class="ig-slider-btn next shadow-pink flex-center" type="button" aria-label="Next" onclick="document.getElementById('ig-track').scrollBy({left:350,behavior:'smooth'})" style="position:absolute;top:50%;right:0;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;background:#ebd8dd;border:none;z-index:10;cursor:pointer"><i data-lucide="chevron-right" class="icon-sm text-dark-blue"></i></button>
        </div>

        <div class="footer-bottom-grid grid-2 text-left mt-xl pt-xl border-t border-pink-dark gap-md max-w-lg mx-auto">
          <div class="newsletter-col"><h4 class="text-dark-blue font-inter font-bold text-lg mb-sm pr-md">Become A Member</h4><a href="${JOIN_URL}" class="btn btn-primary-pink rounded-pill px-xl py-md font-bold tracking-wide mt-md inline-flex align-center gap-xs text-md">Apply for membership</a><br><a href="https://www.whatsapp.com/channel/0029VbBqRXi8V0twOPec2e3d" target="_blank" rel="noopener" class="footer-channel-link mt-md inline-flex align-center gap-xs text-sm"><i data-lucide="message-circle" class="icon-sm"></i> Follow our WhatsApp channel</a></div>
          <div class="contact-col pl-xl text-right"><h4 class="text-dark-blue font-inter font-bold text-md mb-sm">Still have a question?<br><a href="/connect-with-us/" class="text-rose hover-text-dark" style="text-decoration:none">Contact Us!</a></h4><div class="flex-center text-dark-blue justify-end mt-sm gap-md"><a href="mailto:sadhna@sheeo-summit.com" class="text-rose text-sm font-bold hover-text-dark" style="text-decoration:none">sadhna@sheeo-summit.com</a><a href="tel:+971507091969" class="text-rose text-sm font-bold hover-text-dark" style="text-decoration:none">+971 50 7091969</a></div><div class="flex-center text-dark-blue justify-end mt-sm gap-md"><a href="https://www.instagram.com/sheeosummit2026/" target="_blank" rel="noopener" class="text-rose hover-text-dark" aria-label="Instagram"><i data-lucide="instagram" class="icon-sm"></i></a><a href="https://www.facebook.com/sadhnarishisharma/" target="_blank" rel="noopener" class="text-rose hover-text-dark" aria-label="Facebook"><i data-lucide="facebook" class="icon-sm"></i></a><a href="https://www.linkedin.com/in/sadhna-sharma-8767b817/" target="_blank" rel="noopener" class="text-rose hover-text-dark" aria-label="LinkedIn"><i data-lucide="linkedin" class="icon-sm"></i></a><a href="https://api.whatsapp.com/send?phone=+971507091969" target="_blank" rel="noopener" class="text-rose hover-text-dark" aria-label="WhatsApp"><i data-lucide="message-circle" class="icon-sm"></i></a></div></div>
        </div>
        <div class="footer-copyright flex-between text-xs text-dark-blue font-bold font-inter mt-xl pt-lg border-t border-pink-dark"><div class="flex gap-lg"><a href="/privacy-policy/" class="hover-text-rose uppercase tracking-wide" style="text-decoration:none;color:inherit">Privacy Policy</a><a href="/terms-and-conditions/" class="hover-text-rose uppercase tracking-wide" style="text-decoration:none;color:inherit">Terms &amp; Conditions</a><a href="/Business_License.pdf" target="_blank" class="hover-text-rose uppercase tracking-wide" style="text-decoration:none;color:inherit">Business License</a></div><div class="tracking-wide">© 2026 SHEEO BUSINESS NETWORK DUBAI.<br>ALL RIGHTS RESERVED</div></div>
      </div>
    </footer>`;

  const whatsappFloat = `
    <a href="https://wa.me/971507091969" class="whatsapp-float" target="_blank" rel="noopener noreferrer" aria-label="Contact us on WhatsApp">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
    </a>`;

  function fillSlot(selector, markup) {
    const slot = document.querySelector(selector);
    if (!slot) return false;
    slot.insertAdjacentHTML("beforebegin", markup);
    slot.remove();
    return true;
  }

  const hasFooter = fillSlot("[data-global-footer]", footer);
  fillSlot("[data-global-header]", header);

  // Floating WhatsApp button — only add if the page doesn't already have one.
  if (!document.querySelector(".whatsapp-float")) {
    document.body.insertAdjacentHTML("beforeend", whatsappFloat);
  }

  // Instagram embed processor for the footer reel strip.
  if (hasFooter && !document.querySelector('script[src*="instagram.com/embed.js"]')) {
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.instagram.com/embed.js";
    document.body.appendChild(s);
  }

  // ---- Mobile navigation ----------------------------------------------------
  const btn = document.getElementById("mobile-menu-btn");
  const menu = document.getElementById("mobile-menu");

  function setMenu(open) {
    if (!menu || !btn) return;
    menu.classList.toggle("hidden", !open);
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    btn.innerHTML = open ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>';
    // Stop the page scrolling underneath the open drawer.
    document.body.style.overflow = open ? "hidden" : "";
    if (window.lucide) window.lucide.createIcons();
  }

  if (btn && menu) {
    btn.addEventListener("click", () => setMenu(menu.classList.contains("hidden")));
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenu(false);
    });
  }

  // ---- Navbar scrolled state ----------------------------------------------
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    const onScroll = () => navbar.classList.toggle("scrolled", window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ---- Icons -------------------------------------------------------------
  // Lucide dropped its brand icons in v1, which silently blanked the Instagram,
  // Facebook and LinkedIn links in the footer and on member pages. Re-register
  // them so the existing data-lucide markup keeps working.
  const BRAND_ICONS = {
    Instagram: [
      ["rect", { width: "20", height: "20", x: "2", y: "2", rx: "5", ry: "5" }],
      ["path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" }],
      ["line", { x1: "17.5", x2: "17.51", y1: "6.5", y2: "6.5" }]
    ],
    Facebook: [
      ["path", { d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" }]
    ],
    Linkedin: [
      ["path", { d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" }],
      ["rect", { width: "4", height: "12", x: "2", y: "9" }],
      ["circle", { cx: "4", cy: "4", r: "2" }]
    ]
  };

  // lucide.icons is frozen, so the brand icons are merged in by wrapping
  // createIcons once. Every existing bare createIcons() call across the site
  // then picks them up.
  function patchLucide() {
    const lucide = window.lucide;
    if (!lucide || lucide.__sheeoBrandIcons) return;
    const original = lucide.createIcons.bind(lucide);
    const icons = Object.assign({}, lucide.icons, BRAND_ICONS);
    lucide.createIcons = (options = {}) => original(Object.assign({}, options, { icons: options.icons || icons }));
    lucide.__sheeoBrandIcons = true;
  }

  function drawIcons() {
    if (!window.lucide) return void setTimeout(drawIcons, 120);
    patchLucide();
    window.lucide.createIcons();
  }
  drawIcons();
})();
