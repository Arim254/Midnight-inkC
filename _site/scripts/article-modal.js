// =============================
// Article Modal (Universal)
// =============================
document.addEventListener("DOMContentLoaded", () => {
  // 1. Inject modal structure into DOM
  const modalHTML = `
    <div id="article-modal" class="article-modal hidden">
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <button class="modal-close" aria-label="Close">&times;</button>
        <div class="modal-body">
          <h2 id="modal-title"></h2>
          <p id="modal-date"></p>
          <img id="modal-image" alt="" />
          <div id="modal-text"></div>
          <a id="modal-link" href="#" target="_blank" rel="noopener">Read full on source →</a>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // 2. Get references
  const modal = document.getElementById("article-modal");
  const overlay = modal.querySelector(".modal-overlay");
  const closeBtn = modal.querySelector(".modal-close");
  const titleEl = document.getElementById("modal-title");
  const dateEl = document.getElementById("modal-date");
  const imgEl = document.getElementById("modal-image");
  const textEl = document.getElementById("modal-text");
  const linkEl = document.getElementById("modal-link");

  // Small sanitizer to strip unwanted tags
  function sanitizeHTML(html) {
    if (!html) return "";
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<\/?(?:div|span)[^>]*>/gi, ""); // strip extra wrappers
  }

  // 3. Open modal function
  function openModal(article) {
    titleEl.textContent = article.title || "Untitled";
    dateEl.textContent = article.date || "";
    imgEl.src = article.image || "";
    imgEl.style.display = article.image ? "block" : "none";

    // Prefer full body if available, fallback to description
    const content = article.body || article.description || "No preview available.";
    textEl.innerHTML = sanitizeHTML(content);

    linkEl.href = article.url || "#";

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // prevent background scroll
  }

  // 4. Close modal function
  function closeModal() {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
  }

  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", closeModal);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });

  // 5. Attach to article links globally
  document.body.addEventListener("click", e => {
    const link = e.target.closest("a");
    if (!link) return;

    const articleEl = link.closest(
      ".trending-article, .post-card, .music-item, .arts-list li"
    );
    if (!articleEl) return;

    e.preventDefault();

    // Pull body text from <template class="article-body"> if it exists
    const tpl = articleEl.querySelector("template.article-body");
    const bodyHTML = tpl ? tpl.innerHTML.trim() : "";

    // Build article object
    const article = {
      title: link.textContent.trim(),
      url: link.href,
      image: articleEl.querySelector("img")?.src || "",
      date: articleEl.querySelector(".date")?.textContent || "",
      description: articleEl.querySelector("p")?.textContent || "",
      body: bodyHTML || articleEl.dataset.body || "" // prefer <template>, fallback to data-body
    };

    openModal(article);
  });
});
