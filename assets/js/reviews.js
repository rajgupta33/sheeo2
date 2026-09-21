/*
  SheEO community reviews.

  Reads approved reviews from a Google Sheet through an Apps Script web app
  (/google-apps-script/reviews.gs) and posts new ones back to it. The web app
  URL lives in data-endpoint on #reviews.

  Review text comes from the public, so it is only ever written with
  textContent — never innerHTML.
*/
(() => {
  const section = document.getElementById("reviews");
  if (!section) return;

  const ENDPOINT = (section.dataset.endpoint || "").trim();
  const PAGE_SIZE = window.matchMedia("(max-width: 768px)").matches ? 3 : 6;
  const REFRESH_MS = 120000;
  // Keyed to the endpoint so a new sheet never shows an old sheet's reviews.
  const CACHE_KEY = "sheeo-reviews:" + ENDPOINT;

  const list = section.querySelector("[data-reviews-list]");
  const empty = section.querySelector("[data-reviews-empty]");
  const more = section.querySelector("[data-reviews-more]");
  const summary = section.querySelector("[data-reviews-summary]");
  const form = section.querySelector("[data-review-form]");
  const openBtn = section.querySelector("[data-review-open]");
  const status = section.querySelector("[data-review-status]");
  const counter = section.querySelector("[data-review-count]");

  let reviews = [];
  let shown = PAGE_SIZE;

  // ---- rendering ---------------------------------------------------------

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function stars(rating, target) {
    const box = target || el("span", "review-stars");
    box.textContent = "";
    box.setAttribute("aria-label", `${rating} out of 5 stars`);
    for (let i = 1; i <= 5; i++) box.appendChild(el("span", i <= Math.round(rating) ? "" : "is-off", "★"));
    return box;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  }

  function card(review) {
    const article = el("article", "review-card");
    article.appendChild(stars(review.rating));

    const text = el("p", "review-card__text", review.text);
    article.appendChild(text);

    const person = el("div", "review-card__person");
    person.appendChild(el("span", "review-card__avatar", (review.name || "?").trim().charAt(0).toUpperCase()));
    const who = el("div", "review-card__who");
    who.appendChild(el("span", "review-card__name", review.name));
    if (review.role) who.appendChild(el("span", "review-card__role", review.role));
    person.appendChild(who);
    const date = formatDate(review.date);
    if (date) person.appendChild(el("time", "review-card__date", date));
    article.appendChild(person);

    // Offer "Read more" only when the clamp actually hides text.
    requestAnimationFrame(() => {
      if (text.scrollHeight - text.clientHeight < 4) return;
      const toggle = el("button", "review-card__toggle", "Read more");
      toggle.type = "button";
      toggle.addEventListener("click", () => {
        const open = article.classList.toggle("is-expanded");
        toggle.textContent = open ? "Show less" : "Read more";
      });
      text.after(toggle);
    });
    return article;
  }

  function render() {
    list.textContent = "";
    const hasReviews = reviews.length > 0;
    list.hidden = !hasReviews;
    empty.hidden = hasReviews;
    reviews.slice(0, shown).forEach((r) => list.appendChild(card(r)));
    more.hidden = reviews.length <= shown;

    summary.hidden = !hasReviews;
    if (hasReviews) {
      const avg = reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length;
      section.querySelector("[data-reviews-average]").textContent = avg.toFixed(1);
      stars(avg, section.querySelector("[data-reviews-stars]"));
      section.querySelector("[data-reviews-count]").textContent =
        `${reviews.length} review${reviews.length === 1 ? "" : "s"}`;
    }
  }

  function setReviews(next) {
    reviews = (Array.isArray(next) ? next : []).filter((r) => r && r.text && r.name);
    render();
  }

  // ---- loading -----------------------------------------------------------

  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch (e) { return null; }
  }

  function writeCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) { /* storage may be blocked */ }
  }

  let loading = false;
  async function load() {
    if (!ENDPOINT || loading) return;
    loading = true;
    try {
      const res = await fetch(ENDPOINT, { cache: "no-store" });
      const data = await res.json();
      if (!data || !data.ok) throw new Error("Bad response");
      writeCache(data.reviews);
      setReviews(data.reviews);
    } catch (err) {
      // Keep whatever is on screen (cached reviews); only fall back to the
      // empty state if we have nothing at all.
      if (!reviews.length) setReviews([]);
    } finally {
      loading = false;
    }
  }

  // ---- form --------------------------------------------------------------

  function setStatus(message, kind) {
    status.textContent = message;
    status.className = "review-form__status" + (kind ? ` is-${kind}` : "");
  }

  function toggleForm(open) {
    form.hidden = !open;
    openBtn.hidden = open;
    openBtn.setAttribute("aria-expanded", String(open));
    if (open) {
      setStatus("");
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => form.querySelector('input[name="name"]').focus({ preventScroll: true }), 350);
    }
  }

  openBtn.addEventListener("click", () => toggleForm(true));
  section.querySelector("[data-review-cancel]").addEventListener("click", () => {
    toggleForm(false);
    openBtn.focus();
  });

  more.addEventListener("click", () => {
    shown += PAGE_SIZE;
    render();
  });

  const textarea = form.querySelector("textarea[name='review']");
  textarea.addEventListener("input", () => {
    counter.textContent = `${textarea.value.length} / 800`;
  });

  function validate() {
    const f = form.elements;
    if (f.name.value.trim().length < 2) return [f.name, "Please add your name."];
    if (f.review.value.trim().length < 20) return [f.review, "Please write at least 20 characters."];
    if (f.email.value && !f.email.checkValidity()) return [f.email, "That email address looks incomplete."];
    if (!f.consent.checked) return [f.consent, "Please tick the box so we can show your review."];
    return null;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setStatus(problem[1], "error");
      problem[0].focus();
      return;
    }
    if (!ENDPOINT) {
      setStatus("Reviews aren't connected yet. Please try again soon.", "error");
      return;
    }

    const f = form.elements;
    const payload = {
      name: f.name.value.trim(),
      role: f.role.value.trim(),
      rating: Number(form.querySelector("input[name='rating']:checked").value),
      review: f.review.value.trim(),
      email: f.email.value.trim(),
      consent: f.consent.checked,
      website: f.website.value
    };

    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;
    submit.textContent = "Sending…";
    setStatus("");

    try {
      // text/plain keeps this a "simple" request, so Apps Script needs no CORS preflight.
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload)
      });
      let data = null;
      try { data = await res.json(); } catch (e) { /* not JSON: treat as a network failure */ }
      if (!data) throw new Error("");
      // Only messages written by our Apps Script are shown to the visitor.
      if (!data.ok) throw new Error(data.error || "");

      form.reset();
      counter.textContent = "0 / 800";
      if (data.approved) {
        setStatus("Thank you! Your review is live.", "success");
        load();
      } else {
        setStatus("Thank you! Your review will appear once our team has checked it.", "success");
      }
    } catch (err) {
      setStatus(err.message || "We couldn't send your review. Please check your connection and try again.", "error");
    } finally {
      submit.disabled = false;
      submit.textContent = "Submit review";
    }
  });

  // ---- start -------------------------------------------------------------

  if (!ENDPOINT) {
    setReviews([]);
    return;
  }

  const cached = readCache();
  if (cached) setReviews(cached);

  // Fetch when the section is near the viewport, then keep it fresh while the
  // tab is visible.
  const start = () => {
    load();
    setInterval(() => { if (!document.hidden) load(); }, REFRESH_MS);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) load(); });
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      start();
    }, { rootMargin: "600px 0px" });
    io.observe(section);
  } else {
    start();
  }
})();
