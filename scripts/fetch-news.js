// scripts/fetch-news.js
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { extract } = require("@extractus/article-extractor");

// =============================
// API Keys
// =============================
const ALPHA_VANTAGE_KEY = "TFCSH65XW97MHM1I";                   // Finance
const NYT_KEY = "Km4KEFpsEyK7TLzU8A2oNYQSNfkPWjfF";             // World & Arts
const GUARDIAN_KEY = "9b84a35c-9eee-4562-846b-6c6979cdf1eb";    // Culture & Music
const GNEWS_KEY = "65d2757e623a60f9998207bc26c1083c";           // Trending + Tech Page
const TMDB_KEY = "f4cbf268afc603fb50cec0a5a40abcc1";            // Life page (TMDb)

// =============================
// File paths
// =============================
const DATA_DIR = path.join(__dirname, "../src/data");
const FILES = {
  finance: path.join(DATA_DIR, "finance.json"),
  trending: path.join(DATA_DIR, "trending.json"),
  worldnews: path.join(DATA_DIR, "worldnews.json"),
  tech: path.join(DATA_DIR, "tech.json"),
  techp: path.join(DATA_DIR, "techp.json"),
  culture: path.join(DATA_DIR, "culture.json"),
  music: path.join(DATA_DIR, "music.json"),
  arts: path.join(DATA_DIR, "arts.json"),
  lifep: path.join(DATA_DIR, "lifep.json"),
};

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// =============================
// Defaults / helpers
// =============================
const DEFAULT_IMG = "/assets/images/news/default.jpg";

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

async function enrichArticle(url) {
  try {
    const extracted = await extract(url);
    if (extracted && extracted.content) return extracted.content;
  } catch (_) {}
  return "";
}

function stripTags(html = "") {
  return html.replace(/<[^>]+>/g, "");
}

function escapeHTML(str = "") {
  return str
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =============================
// Finance (AlphaVantage + enrich)
// =============================
async function fetchFinance() {
  let finance = [];
  try {
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=financial_markets&apikey=${ALPHA_VANTAGE_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.feed) {
      for (const item of data.feed.slice(0, 4)) {
        const body = await enrichArticle(item.url);
        finance.push({
          title: item.title || "Finance News",
          url: item.url || "#",
          image: item.banner_image || DEFAULT_IMG,
          tag: "Finance",
          date: item.time_published?.slice(0, 10) || new Date().toISOString().split("T")[0],
          description: item.summary || "",
          body: body || item.summary || "",
        });
      }
    }

    saveJSON(FILES.finance, finance);
    console.log("💰 Finance saved:", finance.length);
  } catch (err) {
    console.error("❌ Finance error:", err);
  }
}

// =============================
// Trending (GNews + enrich)
// =============================
async function fetchTrending() {
  let trending = [];
  try {
    const url = `https://gnews.io/api/v4/top-headlines?token=${GNEWS_KEY}&lang=en&country=us&max=4`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.articles) {
      for (const item of data.articles) {
        const body = await enrichArticle(item.url);
        trending.push({
          title: item.title || "Trending News",
          url: item.url || "#",
          image: item.image || DEFAULT_IMG,
          tag: "Trending",
          date: item.publishedAt?.split("T")[0] || new Date().toISOString().split("T")[0],
          description: item.description || "",
          body: body || item.content || item.description || "",
        });
      }
    }

    saveJSON(FILES.trending, trending);
    console.log("🔥 Trending saved:", trending.length);
  } catch (err) {
    console.error("❌ Trending error:", err);
  }
}

// =============================
// World News (NYTimes + enrich)
// =============================
async function fetchWorldNews() {
  let worldNews = [];
  try {
    const url = `https://api.nytimes.com/svc/topstories/v2/world.json?api-key=${NYT_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.results) {
      for (const item of data.results.slice(0, 4)) {
        const body = await enrichArticle(item.url);
        worldNews.push({
          title: item.title || "World News",
          url: item.url || "#",
          image: item.multimedia?.[0]?.url || DEFAULT_IMG,
          tag: "World",
          date: item.published_date?.split("T")[0] || new Date().toISOString().split("T")[0],
          description: item.abstract || "",
          body: body || item.abstract || "",
        });
      }
    }

    saveJSON(FILES.worldnews, worldNews);
    console.log("🌍 World News saved:", worldNews.length);
  } catch (err) {
    console.error("❌ World News error:", err);
  }
}

// =============================
// Tech (homepage) — TechCrunch
// =============================
async function fetchTech() {
  let tech = [];
  try {
    const url = "https://techcrunch.com/wp-json/wp/v2/posts?per_page=4&_embed";
    const res = await fetch(url);
    const data = await res.json();

    if (Array.isArray(data)) {
      data.forEach((item) => {
        tech.push({
          title: item.title?.rendered || "Tech News",
          url: item.link || "#",
          image: item._embedded?.["wp:featuredmedia"]?.[0]?.source_url || DEFAULT_IMG,
          tag: "Tech",
          date: item.date ? item.date.split("T")[0] : new Date().toISOString().split("T")[0],
          description: stripTags(item.excerpt?.rendered || ""),
        });
      });
    }

    saveJSON(FILES.tech, tech);
    console.log("🖥️ Tech (homepage) saved:", tech.length);
  } catch (err) {
    console.error("❌ Tech error:", err);
  }
}

// =============================
// Tech Page — GNews + enrich
// =============================
async function fetchTechPage() {
  let techPage = [];
  try {
    const url = `https://gnews.io/api/v4/top-headlines?token=${GNEWS_KEY}&topic=technology&lang=en&country=us&max=4`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.articles) {
      for (const item of data.articles) {
        const body = await enrichArticle(item.url);
        techPage.push({
          title: item.title,
          url: item.url,
          image: item.image || DEFAULT_IMG,
          tag: "Tech",
          date: item.publishedAt?.split("T")[0] || new Date().toISOString().split("T")[0],
          description: item.description || "",
          body: body || item.content || "",
        });
      }
    }

    saveJSON(FILES.techp, techPage);
    console.log("📰 Tech Page saved:", techPage.length);
  } catch (err) {
    console.error("❌ Tech Page error:", err);
  }
}

// =============================
// Guardian Culture (API + enrich)
// =============================
async function fetchCulture() {
  let culture = [];
  try {
    const url = `https://content.guardianapis.com/culture?api-key=${GUARDIAN_KEY}&show-fields=trailText,thumbnail,body&page-size=4`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.response && data.response.results) {
      for (const item of data.response.results) {
        const body = await enrichArticle(item.webUrl);
        culture.push({
          title: item.webTitle,
          url: item.webUrl,
          image: item.fields?.thumbnail || DEFAULT_IMG,
          tag: "Culture",
          date: item.webPublicationDate?.split("T")[0],
          description: item.fields?.trailText || "",
          body: body || item.fields?.body || "",
        });
      }
    }

    saveJSON(FILES.culture, culture);
    console.log("🎭 Culture saved:", culture.length);
  } catch (err) {
    console.error("❌ Culture error:", err);
  }
}

// =============================
// Guardian Music (API + enrich)
// =============================
async function fetchMusic() {
  let music = [];
  try {
    const url = `https://content.guardianapis.com/music?api-key=${GUARDIAN_KEY}&show-fields=trailText,thumbnail,body&page-size=4`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.response && data.response.results) {
      for (const item of data.response.results) {
        const body = await enrichArticle(item.webUrl);
        music.push({
          title: item.webTitle,
          url: item.webUrl,
          image: item.fields?.thumbnail || DEFAULT_IMG,
          tag: "Music",
          date: item.webPublicationDate?.split("T")[0],
          description: item.fields?.trailText || "",
          body: body || item.fields?.body || "",
        });
      }
    }

    saveJSON(FILES.music, music);
    console.log("🎵 Music saved:", music.length);
  } catch (err) {
    console.error("❌ Music error:", err);
  }
}

// =============================
// NYTimes Arts (API + enrich)
// =============================
async function fetchArts() {
  let arts = [];
  try {
    const url = `https://api.nytimes.com/svc/topstories/v2/arts.json?api-key=${NYT_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.results) {
      for (const item of data.results.slice(0, 4)) {
        const body = await enrichArticle(item.url);
        arts.push({
          title: item.title,
          url: item.url,
          tag: "Arts",
          date: item.published_date?.split("T")[0],
          description: item.abstract || "",
          body: body || item.abstract || "",
        });
      }
    }

    saveJSON(FILES.arts, arts);
    console.log("🖼️ Arts saved:", arts.length);
  } catch (err) {
    console.error("❌ Arts error:", err);
  }
}

// =============================
// Life Page — TMDb (Movies/TV)
// =============================
function tmdbImage(path, size = "w780") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : DEFAULT_IMG;
}

function tmdbItemToArticle(it) {
  const kind = it.media_type || (it.title ? "movie" : "tv");
  const title = it.title || it.name || "Untitled";
  const date = it.release_date || it.first_air_date || new Date().toISOString().split("T")[0];
  const image = tmdbImage(it.backdrop_path || it.poster_path);
  const url = `https://www.themoviedb.org/${kind}/${it.id}`;
  const overview = it.overview || "";

  const body = `
    <div class="tmdb-article">
      <p>${escapeHTML(overview)}</p>
      <ul>
        <li><strong>Type:</strong> ${kind.toUpperCase()}</li>
        <li><strong>Release:</strong> ${escapeHTML(date)}</li>
        <li><strong>Rating:</strong> ${typeof it.vote_average === "number" ? it.vote_average.toFixed(1) : "N/A"}/10</li>
        <li><strong>Votes:</strong> ${it.vote_count ?? 0}</li>
        <li><strong>Popularity:</strong> ${it.popularity ?? "N/A"}</li>
      </ul>
    </div>
  `;

  return {
    title,
    url,
    image,
    tag: "Life",
    date,
    description: overview,
    body,
  };
}

async function fetchLife() {
  let page = [];
  try {
    // Grab trending movies & TV, then take top 4 combined
    const [mRes, tRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`),
      fetch(`https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_KEY}`),
    ]);

    const [mData, tData] = await Promise.all([mRes.json(), tRes.json()]);
    const movies = Array.isArray(mData.results) ? mData.results : [];
    const tv = Array.isArray(tData.results) ? tData.results : [];

    const combined = [...movies.slice(0, 8), ...tv.slice(0, 8)] // widen pool a bit
      .slice(0, 12) // cap
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 4);

    page = combined.map(tmdbItemToArticle);

    saveJSON(FILES.lifep, page);
    console.log("🎬 Life (TMDb) saved:", page.length);
  } catch (err) {
    console.error("❌ Life (TMDb) error:", err);
    saveJSON(FILES.lifep, []); // keep file valid
  }
}

// =============================
// Main runner
// =============================
(async () => {
  await fetchFinance();
  await fetchTrending();
  await fetchWorldNews();
  await fetchTech();
  await fetchTechPage();
  await fetchCulture();
  await fetchMusic();
  await fetchArts();
  await fetchLife(); // TMDb-powered Life page
  console.log("✅ All data fetched & saved.");
})();
