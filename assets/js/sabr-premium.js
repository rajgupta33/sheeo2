(() => {
  const relatedMembers = [
    { name: "Sadhna Sharma", category: "Business Growth Strategist", image: "/founder-sadhna.jpg", url: "/sheeo-member/sadhna-sharma/" },
    { name: "Mehak Marwaha", category: "Founder of Ekaa · Holistic Clarity Coach", image: "/sheeo-member/mehak.jpeg", url: "/sheeo-member/mehak-marwaha/" },
    { name: "Nitasha Saxena", category: "Founder of Mindful Make-Up · Beauty Educator", image: "/sheeo-member/nitasha.jpeg", url: "/sheeo-member/nitasha-saxena/" }
  ];

  const menuButton = document.querySelector(".nav-toggle");
  const menu = document.querySelector("#primary-menu");
  const dialog = document.querySelector("#intro-dialog");
  const introForm = document.querySelector("#intro-form");
  const status = document.querySelector("#intro-status");
  const relatedGrid = document.querySelector("#related-members");

  function track(eventName, parameters = {}) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...parameters });
    if (typeof window.gtag === "function") window.gtag("event", eventName, parameters);
  }

  function openDialog() {
    if (!dialog) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    requestAnimationFrame(() => dialog.querySelector("input")?.focus());
    track("request_intro_open", { brand_name: "SABR" });
  }

  function closeDialog() {
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function renderRelatedMembers() {
    if (!relatedGrid) return;
    relatedGrid.innerHTML = relatedMembers.map((member) => `<article class="related-card"><img src="${member.image}" alt="${member.name}" loading="lazy"><div class="related-card__body"><h3>${member.name}</h3><p>${member.category}</p><a href="${member.url}" data-related-member="${member.name}">View profile →</a></div></article>`).join("");
    relatedGrid.querySelectorAll("[data-related-member]").forEach((link) => link.addEventListener("click", () => track("member_card_click", { member_name: link.dataset.relatedMember, source: "sabr_related" })));
  }

  menuButton?.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
    menu?.classList.toggle("is-open", !isOpen);
  });

  document.querySelectorAll("[data-open-intro]").forEach((button) => button.addEventListener("click", openDialog));
  document.querySelectorAll("[data-close-intro]").forEach((button) => button.addEventListener("click", closeDialog));
  dialog?.addEventListener("click", (event) => { if (event.target === dialog) closeDialog(); });

  introForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!introForm.reportValidity()) return;
    const data = new FormData(introForm);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const business = String(data.get("business") || "").trim();
    const message = String(data.get("message") || "").trim();
    const subject = encodeURIComponent("SheEO introduction request: SABR");
    const body = encodeURIComponent(`Hello SheEO team,\n\nI would like to request an introduction to SABR.\n\nName: ${name}\nEmail: ${email}\nBusiness / organisation: ${business || "Not provided"}\n\nHow SABR can help:\n${message}\n\nThank you.`);
    if (status) status.textContent = "Opening your email app with the introduction request…";
    track("request_intro_submit", { brand_name: "SABR" });
    window.location.href = `mailto:sadhna@sheeo-summit.com?subject=${subject}&body=${body}`;
  });

  document.querySelectorAll("[data-analytics]").forEach((element) => element.addEventListener("click", () => track(element.dataset.analytics, { brand_name: "SABR" })));
  renderRelatedMembers();
  track("member_profile_view", { member_name: "SABR", profile_type: "premium_brand" });
})();
