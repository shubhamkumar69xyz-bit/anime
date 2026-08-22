/* ==========================================================================
   SCRIPT.JS - MY ANIME ARCHIVE
   Vanilla JavaScript for search, filter, modal, counter, and navigation.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // ==========================================================================
  // CONFIGURATION / SELECTORS
  // Update these selectors if you modify class names or IDs in your HTML.
  // ==========================================================================
  const SELECTORS = {
    cards: ".anime-card",
    grid: ".anime-grid",
    collectionHeader: ".collection-header",
    heroBtn: ".hero-actions a",
    navLinks: ".nav-link",
    sections: "section[id]",
    footerCopyright: ".footer-copyright",
  };

  // Cache primary elements
  const animeCards = Array.from(document.querySelectorAll(SELECTORS.cards));
  const animeGrid = document.querySelector(SELECTORS.grid);
  const collectionHeader = document.querySelector(SELECTORS.collectionHeader);
  const navLinks = document.querySelectorAll(SELECTORS.navLinks);
  const sections = document.querySelectorAll(SELECTORS.sections);
  const footerCopyright = document.querySelector(SELECTORS.footerCopyright);

  // Check if reduced motion is preferred by the user's system
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // ==========================================================================
  // 1. INJECT DYNAMIC UI (Search, Filter, Counter, Modal, Back-to-Top)
  // Generates UI elements dynamically to keep your HTML clean.
  // ==========================================================================
  let searchInput;
  let filterSelect;
  let counterDisplay;
  let noResultsMsg;
  let modalOverlay;
  let modalContent;
  let backToTopBtn;

  function initDynamicUI() {
    // 1A. Controls Bar (Search + Genre Filter + Counter)
    if (collectionHeader) {
      const controlsContainer = document.createElement("div");
      controlsContainer.className = "archive-controls";
      controlsContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        justify-content: center;
        align-items: center;
        margin-top: 25px;
      `;

      // Search input
      searchInput = document.createElement("input");
      searchInput.type = "search";
      searchInput.placeholder = "Search collection by title...";
      searchInput.setAttribute("aria-label", "Search anime by title");
      searchInput.className = "archive-search-input";
      searchInput.style.cssText = `
        background-color: var(--bg-surface, #151518);
        border: 1px solid var(--border-subtle, #27272a);
        color: var(--text-main, #f4f4f5);
        padding: 10px 16px;
        border-radius: var(--radius-sm, 4px);
        font-size: 0.95rem;
        width: 100%;
        max-width: 280px;
        outline: none;
      `;

      // Genre filter dropdown
      filterSelect = document.createElement("select");
      filterSelect.setAttribute("aria-label", "Filter anime by genre");
      filterSelect.className = "archive-filter-select";
      filterSelect.style.cssText = `
        background-color: var(--bg-surface, #151518);
        border: 1px solid var(--border-subtle, #27272a);
        color: var(--text-main, #f4f4f5);
        padding: 10px 16px;
        border-radius: var(--radius-sm, 4px);
        font-size: 0.95rem;
        outline: none;
        cursor: pointer;
      `;

      // Populate genres dynamically from the HTML cards
      const genresSet = new Set();
      animeCards.forEach((card) => {
        const genreText = card.querySelector(".anime-genre")?.textContent || "";
        genreText.split("/").forEach((g) => {
          const trimmed = g.trim();
          if (trimmed) genresSet.add(trimmed);
        });
      });

      const defaultOption = document.createElement("option");
      defaultOption.value = "ALL";
      defaultOption.textContent = "All Genres";
      filterSelect.appendChild(defaultOption);

      Array.from(genresSet)
        .sort()
        .forEach((genre) => {
          const opt = document.createElement("option");
          opt.value = genre;
          opt.textContent = genre;
          filterSelect.appendChild(opt);
        });

      // Watched Counter Badge
      counterDisplay = document.createElement("div");
      counterDisplay.className = "archive-counter-badge";
      counterDisplay.style.cssText = `
        background-color: rgba(123, 44, 191, 0.2);
        border: 1px solid var(--accent-purple, #7b2cbf);
        color: var(--text-main, #f4f4f5);
        padding: 8px 14px;
        border-radius: var(--radius-sm, 4px);
        font-weight: bold;
        font-size: 0.9rem;
        letter-spacing: 0.5px;
      `;

      controlsContainer.appendChild(searchInput);
      controlsContainer.appendChild(filterSelect);
      controlsContainer.appendChild(counterDisplay);
      collectionHeader.appendChild(controlsContainer);
    }

    // 1B. "No Anime Found" Feedback Message
    if (animeGrid) {
      noResultsMsg = document.createElement("div");
      noResultsMsg.className = "no-results-message";
      noResultsMsg.textContent = "No anime found.";
      noResultsMsg.style.cssText = `
        display: none;
        grid-column: 1 / -1;
        text-align: center;
        padding: 40px 20px;
        color: var(--text-muted, #a1a1aa);
        font-size: 1.2rem;
        background-color: var(--bg-surface, #151518);
        border: 1px dashed var(--border-subtle, #27272a);
        border-radius: var(--radius-md, 8px);
      `;
      animeGrid.appendChild(noResultsMsg);
    }

    // 1C. Details Modal (Hidden by default)
    modalOverlay = document.createElement("div");
    modalOverlay.className = "anime-modal-overlay";
    modalOverlay.setAttribute("role", "dialog");
    modalOverlay.setAttribute("aria-modal", "true");
    modalOverlay.setAttribute("aria-hidden", "true");
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.85);
      z-index: 2000;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
    `;

    modalContent = document.createElement("div");
    modalContent.className = "anime-modal-content";
    modalContent.style.cssText = `
      background-color: var(--bg-surface, #151518);
      border: 1px solid var(--border-subtle, #27272a);
      border-radius: var(--radius-md, 8px);
      max-width: 650px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      padding: 30px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
      color: var(--text-main, #f4f4f5);
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // 1D. Back to Top Button
    backToTopBtn = document.createElement("button");
    backToTopBtn.className = "back-to-top-btn";
    backToTopBtn.setAttribute("aria-label", "Scroll back to top");
    backToTopBtn.innerHTML = "&#8679;"; // Up arrow
    backToTopBtn.style.cssText = `
      position: fixed;
      bottom: 25px;
      right: 25px;
      width: 45px;
      height: 45px;
      background-color: var(--accent-red, #d62828);
      color: #fff;
      border: none;
      border-radius: var(--radius-sm, 4px);
      font-size: 1.5rem;
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 900;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
      transition: background-color 0.2s ease, transform 0.2s ease;
    `;
    document.body.appendChild(backToTopBtn);
  }

  // ==========================================================================
  // 2. WATCHED COUNTER
  // Counts total anime and visible matching anime.
  // ==========================================================================
  function updateCounter(visibleCount = animeCards.length) {
    if (!counterDisplay) return;
    const total = animeCards.length;
    if (visibleCount === total) {
      counterDisplay.textContent = `${total} Anime Watched`;
    } else {
      counterDisplay.textContent = `Showing ${visibleCount} of ${total} Watched`;
    }
  }

  // ==========================================================================
  // 3. SEARCH & GENRE FILTER
  // Real-time keyword search and category filtering.
  // ==========================================================================
  function filterCollection() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedGenre = filterSelect ? filterSelect.value : "ALL";
    let visibleCount = 0;

    animeCards.forEach((card) => {
      const title = card.querySelector(".anime-title")?.textContent.toLowerCase() || "";
      const genre = card.querySelector(".anime-genre")?.textContent || "";

      const matchesSearch = title.includes(searchTerm);
      const matchesGenre =
        selectedGenre === "ALL" || genre.includes(selectedGenre);

      if (matchesSearch && matchesGenre) {
        card.style.display = "flex";
        visibleCount++;
      } else {
        card.style.display = "none";
      }
    });

    if (noResultsMsg) {
      noResultsMsg.style.display = visibleCount === 0 ? "block" : "none";
    }

    updateCounter(visibleCount);
  }

  function initSearchAndFilter() {
    if (searchInput) searchInput.addEventListener("input", filterCollection);
    if (filterSelect) filterSelect.addEventListener("change", filterCollection);
  }

  // ==========================================================================
  // 4. ANIME CARD INTERACTION & INTERSECTION OBSERVER
  // Smoothly reveals cards as they scroll into view.
  // ==========================================================================
  function initCardAnimations() {
    if (prefersReducedMotion || !("IntersectionObserver" in window)) return;

    animeCards.forEach((card) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(20px)";
      card.style.transition =
        "opacity 0.4s ease-out, transform 0.4s ease-out, box-shadow 0.3s ease-in-out, background-color 0.3s ease-in-out";
    });

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    animeCards.forEach((card) => observer.observe(card));
  }

  // ==========================================================================
  // 5. ANIME DETAILS MODAL
  // Clicking any card opens a detailed view; handles Escape and outside clicks.
  // ==========================================================================
  let lastFocusedElement = null;

  function openModal(card) {
    const posterSrc = card.querySelector(".anime-poster")?.src || "";
    const posterAlt = card.querySelector(".anime-poster")?.alt || "Anime poster";
    const title = card.querySelector(".anime-title")?.textContent || "Anime Details";
    const genre = card.querySelector(".anime-genre")?.textContent || "";
    const status = card.querySelector(".anime-status")?.textContent || "Watched";
    const synopsis = card.querySelector(".anime-synopsis")?.textContent || "";
    const order = card.querySelector(".entry-order")?.textContent || "";

    modalContent.innerHTML = `
      <button class="modal-close-btn" aria-label="Close modal" style="
        position: absolute;
        top: 15px;
        right: 15px;
        background: transparent;
        border: 1px solid var(--border-subtle, #27272a);
        color: var(--text-main, #f4f4f5);
        font-size: 1.2rem;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      ">&times;</button>
      <div style="display: flex; gap: 20px; flex-direction: column;">
        <div style="display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap;">
          <img src="${posterSrc}" alt="${posterAlt}" style="
            width: 140px;
            border-radius: var(--radius-sm, 4px);
            border: 1px solid var(--border-subtle, #27272a);
            object-fit: cover;
          ">
          <div style="flex: 1; min-width: 200px;">
            <span style="
              display: inline-block;
              background-color: var(--bg-base, #0a0a0c);
              color: var(--accent-red, #d62828);
              border: 1px solid var(--accent-red, #d62828);
              padding: 2px 8px;
              font-size: 0.8rem;
              font-weight: 800;
              border-radius: 4px;
              margin-bottom: 8px;
            ">${order}</span>
            <h2 style="font-size: 1.6rem; margin-bottom: 10px; color: var(--text-main, #f4f4f5);">${title}</h2>
            <p style="color: var(--accent-orange, #f77f00); font-size: 0.85rem; font-weight: 600; margin-bottom: 8px;">${genre}</p>
            <span style="
              display: inline-block;
              background-color: rgba(123, 44, 191, 0.3);
              color: var(--text-main, #f4f4f5);
              padding: 4px 8px;
              border: 1px solid var(--accent-purple, #7b2cbf);
              border-radius: 4px;
              font-size: 0.8rem;
            ">${status}</span>
          </div>
        </div>
        <div style="border-top: 1px solid var(--border-subtle, #27272a); padding-top: 15px; margin-top: 5px;">
          <h4 style="font-size: 1rem; margin-bottom: 8px; color: var(--text-main, #f4f4f5);">Synopsis</h4>
          <p style="color: var(--text-muted, #a1a1aa); font-size: 0.95rem; line-height: 1.6;">${synopsis}</p>
        </div>
      </div>
    `;

    lastFocusedElement = document.activeElement;
    modalOverlay.style.display = "flex";
    modalOverlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; // Prevent background scrolling

    const closeBtn = modalContent.querySelector(".modal-close-btn");
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    modalOverlay.style.display = "none";
    modalOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function initModal() {
    animeCards.forEach((card) => {
      card.style.cursor = "pointer";
      card.setAttribute("tabindex", "0");
      card.setAttribute("role", "button");
      card.setAttribute(
        "aria-label",
        `View details for ${card.querySelector(".anime-title")?.textContent || "anime"}`
      );

      // Open on click
      card.addEventListener("click", () => openModal(card));

      // Open on Enter key
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal(card);
        }
      });
    });

    // Close on overlay click or close button click
    modalOverlay.addEventListener("click", (e) => {
      if (
        e.target === modalOverlay ||
        e.target.classList.contains("modal-close-btn")
      ) {
        closeModal();
      }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modalOverlay.style.display === "flex") {
        closeModal();
      }
    });
  }

  // ==========================================================================
  // 6. ACTIVE NAVIGATION ON SCROLL
  // Highlights the current nav link based on scroll position.
  // ==========================================================================
  function initActiveNav() {
    window.addEventListener("scroll", () => {
      let currentSectionId = "";
      const scrollPos = window.scrollY + 120; // Offset for header height

      sections.forEach((section) => {
        const top = section.offsetTop;
        const height = section.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          currentSectionId = section.getAttribute("id");
        }
      });

      navLinks.forEach((link) => {
        link.classList.remove("active");
        if (link.getAttribute("href") === `#${currentSectionId}`) {
          link.classList.add("active");
          link.style.borderBottomColor = "var(--accent-red, #d62828)";
          link.style.color = "var(--text-main, #f4f4f5)";
        } else {
          link.style.borderBottomColor = "transparent";
          link.style.color = "var(--text-muted, #a1a1aa)";
        }
      });
    });
  }

  // ==========================================================================
  // 7. BACK TO TOP BUTTON
  // Displays button after scrolling down 400px.
  // ==========================================================================
  function initBackToTop() {
    if (!backToTopBtn) return;

    window.addEventListener("scroll", () => {
      if (window.scrollY > 400) {
        backToTopBtn.style.display = "flex";
      } else {
        backToTopBtn.style.display = "none";
      }
    });

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  }

  // ==========================================================================
  // 8. AUTOMATIC FOOTER COPYRIGHT YEAR
  // Automatically populates the current year dynamically.
  // ==========================================================================
  function initFooterYear() {
    if (footerCopyright) {
      const currentYear = new Date().getFullYear();
      footerCopyright.innerHTML = `&copy; ${currentYear} My Anime Archive. All rights reserved.`;
    }
  }

  // ==========================================================================
  // INITIALIZATION RUNNER
  // ==========================================================================
  initDynamicUI();
  updateCounter();
  initSearchAndFilter();
  initCardAnimations();
  initModal();
  initActiveNav();
  initBackToTop();
  initFooterYear();
});