(() => {
  const businesses = [
    { name: "Sadhna Sharma", business: "Business Growth Strategy", role: "Business Growth Strategist", category: "Business Strategy", services: "business growth sales coaching founder positioning scaling roadmaps", location: "Dubai, UAE", image: "/founder-sadhna.jpg", url: "/sheeo-member/sadhna-sharma/" },
    { name: "Nitasha Saxena", business: "Mindful Make-Up", role: "Mindful Beauty Educator", category: "Beauty & Wellness", services: "mindful makeup beauty education skincare workshops teens tweens women", location: "Dubai, UAE", image: "/sheeo-member/nitasha.jpeg", url: "/sheeo-member/nitasha-saxena/" },
    { name: "Mehak Marwaha", business: "Ekaa", role: "Holistic Clarity Coach & Career Guidance Expert", category: "Coaching & Wellness", services: "career guidance holistic healing clarity coaching life transitions", location: "Dubai, UAE", image: "/sheeo-member/mehak.jpeg", url: "/sheeo-member/mehak-marwaha/" },
    { name: "Meher Rupa", business: "Meher Rupa Coaching", role: "Business & Personal Transformation Coach", category: "Coaching & Wellness", services: "NLP transformation coaching peak performance business personal coaching", location: "Dubai, UAE", image: "/sheeo-member/meher rupaa.jpeg", url: "/sheeo-member/meher-rupa/" },
    { name: "Rashi", business: "Milagro by Rashi · Mohaul", role: "Founder, Creative Entrepreneur & Lifestyle Brand Curator", category: "Home & Lifestyle", services: "luxury handcrafted candles curated gifting fashion apparel intentional living", location: "Dubai, UAE", image: "/sheeo-member/rashimonga.jpeg", url: "/sheeo-member/rashi/" },
    { name: "Raina Desai Lalchand", business: "Emarkiz Web Solutions", role: "Marketplace Growth Strategist & E-Commerce Enabler", category: "Digital & E-Commerce", services: "ecommerce marketplace expansion digital marketing online business growth", location: "Dubai, UAE", image: "/sheeo-member/RAINA DESAI.jpeg", url: "/sheeo-member/raina/" },
    { name: "SABR", business: "SABR", role: "SheEO Premium Brand", category: "Fashion", services: "luxury modest streetwear limited releases UAE clothing", location: "Dubai, UAE", image: "/assets/images/sabr/desert-ivory-front.jpg", url: "/sheeo-member/sabr/", premium: true }
  ];

  const state = { query: "", category: "All categories" };
  const input = document.querySelector("#directory-search");
  const form = document.querySelector("#directory-search-form");
  const filters = document.querySelector("#category-filters");
  const results = document.querySelector("#directory-results");
  const resultCount = document.querySelector("#result-count");
  const menuButton = document.querySelector(".nav-toggle");
  const menu = document.querySelector("#primary-menu");

  function track(eventName, parameters = {}) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...parameters });
    if (typeof window.gtag === "function") window.gtag("event", eventName, parameters);
  }

  function normalized(value) {
    return String(value || "").toLocaleLowerCase().trim();
  }

  function readUrlState() {
    const params = new URLSearchParams(window.location.search);
    state.query = params.get("q") || "";
    state.category = params.get("category") || "All categories";
    const validCategories = new Set(businesses.map((item) => item.category));
    if (state.category !== "All categories" && !validCategories.has(state.category)) state.category = "All categories";
    if (input) input.value = state.query;
  }

  function syncUrl(mode = "replace") {
    const params = new URLSearchParams(window.location.search);
    state.query ? params.set("q", state.query) : params.delete("q");
    state.category !== "All categories" ? params.set("category", state.category) : params.delete("category");
    const queryString = params.toString();
    history[mode === "push" ? "pushState" : "replaceState"]({ ...state }, "", `${window.location.pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`);
  }

  function cardTemplate(item) {
    return `<article class="business-card">
      <div class="business-card__image-wrap"><img class="business-card__image" src="${item.image}" alt="${item.name}" loading="lazy"><span class="business-card__verified" aria-label="Verified business">✓</span></div>
      <div class="business-card__body"><p class="business-card__category">${item.premium ? "SheEO Premium · " : ""}${item.category}</p><h3>${item.name}</h3><p class="business-card__founder"><strong>${item.business}</strong><br>${item.role}</p><p class="business-card__location">⌖ ${item.location}</p><a class="business-card__link" href="${item.url}" data-member="${item.name}">View profile →</a></div>
    </article>`;
  }

  function filteredBusinesses() {
    const query = normalized(state.query);
    return businesses.filter((item) => {
      const categoryMatch = state.category === "All categories" || item.category === state.category;
      const haystack = normalized(`${item.name} ${item.business} ${item.role} ${item.category} ${item.services} ${item.location}`);
      return categoryMatch && (!query || haystack.includes(query));
    });
  }

  function render() {
    if (!results || !resultCount) return;
    const matches = filteredBusinesses();
    results.innerHTML = matches.length ? matches.map(cardTemplate).join("") : `<div class="empty-state"><strong>No businesses found.</strong><br>Try another keyword or clear the selected category.</div>`;
    resultCount.textContent = `${matches.length} ${matches.length === 1 ? "business" : "businesses"} found`;
    filters?.querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.category === state.category)));
    results.querySelectorAll("[data-member]").forEach((link) => link.addEventListener("click", () => track("member_card_click", { member_name: link.dataset.member })));
  }

  function buildFilters() {
    if (!filters) return;
    const categories = ["All categories", ...new Set(businesses.map((item) => item.category))];
    filters.innerHTML = categories.map((category) => `<button class="category-chip" type="button" data-category="${category}" aria-pressed="${category === state.category}">${category}</button>`).join("");
    filters.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-category]");
      if (!button) return;
      state.category = button.dataset.category;
      syncUrl("push");
      render();
      track("directory_filter", { category: state.category });
    });
  }

  let debounceTimer;
  input?.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.query = input.value.trim();
      syncUrl();
      render();
      track("directory_search", { search_term: state.query, result_count: filteredBusinesses().length });
    }, 300);
  });

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    clearTimeout(debounceTimer);
    state.query = input.value.trim();
    syncUrl("push");
    render();
    track("directory_search", { search_term: state.query, result_count: filteredBusinesses().length });
  });

  menuButton?.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    menu?.classList.toggle("is-open", !isOpen);
  });

  document.querySelectorAll("[data-analytics]").forEach((element) => element.addEventListener("click", () => track(element.dataset.analytics)));

  const spotlight = document.querySelector("[data-premium-spotlight]");
  if (spotlight && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        track("premium_spotlight_view", { brand_name: "SABR" });
        observer.disconnect();
      }
    }, { threshold: 0.4 });
    observer.observe(spotlight);
  }

  window.addEventListener("popstate", () => { readUrlState(); render(); });
  readUrlState();
  buildFilters();
  render();
  track("directory_view");
})();
