// scripts/fetch-news.js
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const Parser = require("rss-parser");
const { extract } = require("@extractus/article-extractor");

const parser = new Parser();

// =============================
// API Keys
// =============================
const NYT_KEY = "Km4KEFpsEyK7TLzU8A2oNYQSNfkPWjfF";  // World
const GNEWS_KEY = "65d2757e623a60f9998207bc26c1083c"; // Tech page
const TMDB_KEY = "f4cbf268afc603fb50cec0a5a40abcc1";  // Life fallback

// =============================
// File paths
// =============================
const DATA_DIR = path.join(__dirname, "../src/data");
const FILES = {
  finance: path.join(DATA_DIR, "finance.json"),          // homepage finance
  trending: path.join(DATA_DIR, "trending.json"),        // homepage trending
  worldnews: path.join(DATA_DIR, "worldnews.json"),      // homepage world
  tech: path.join(DATA_DIR, "tech.json"),                // homepage tech
  techp: path.join(DATA_DIR, "techp.json"),              // tech page
  politicsp: path.join(DATA_DIR, "politicsp.json"),      // politics page
  entertainmentp: path.join(DATA_DIR, "entertainmentp.json"), // entertainment page
  financep: path.join(DATA_DIR, "financep.json"),        // finance page
  musicp: path.join(DATA_DIR, "musicp.json"),            // music page
  lifep: path.join(DATA_DIR, "lifep.json"),              // life page
};

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// =============================
// Helpers
// =============================
const DEFAULT_IMG = "/assets/images/news/default.jpg";

function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function stripTags(html = "") {
  return html.replace(/<[^>]+>/g, "");
}

function rssItemToArticle(item, tag) {
  return {
    title: item.title || `${tag} News`,
    url: item.link || "#",
    image: item.enclosure?.url || item["media:content"]?.url || DEFAULT_IMG,
    tag,
    date: (item.isoDate || item.pubDate || new Date().toISOString()).split("T")[0],
    description: stripTags(item.contentSnippet || item.summary || item.content || ""),
    body: stripTags(item.content || item.contentSnippet || ""),
  };
}

async function fetchRSSFeed(url, tag) {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items || []).map((item) => rssItemToArticle(item, tag));
  } catch (err) {
    console.error(`❌ Error fetching RSS: ${url}`, err.message);
    return [];
  }
}

// =============================
// Homepage Feeds
// =============================
async function fetchFinance() {
  let finance = [];
  const rss1 = await fetchRSSFeed("https://feeds.finance.yahoo.com/rss/2.0/headline?s=yhoo&region=US&lang=en-US", "Finance");
  const rss2 = await fetchRSSFeed("https://www.cnbc.com/id/100003114/device/rss/rss.html", "Finance");
  finance = [...rss1, ...rss2].slice(0, 7);
  saveJSON(FILES.finance, finance);
  console.log("💰 Finance saved:", finance.length);
}

async function fetchTrending() {
  let trending = [];
  try {
    const url = `https://gnews.io/api/v4/top-headlines?token=${GNEWS_KEY}&lang=en&country=us&max=7`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.articles) {
      trending = data.articles.map((item) => ({
        title: item.title,
        url: item.url,
        image: item.image || DEFAULT_IMG,
        tag: "Trending",
        date: item.publishedAt?.split("T")[0],
        description: item.description || "",
        body: item.content || "",
      }));
    }
    saveJSON(FILES.trending, trending);
    console.log("🔥 Trending saved:", trending.length);
  } catch (err) {
    console.error("❌ Trending error:", err.message);
  }
}

async function fetchWorldNews() {
  let world = [];
  try {
    const url = `https://api.nytimes.com/svc/topstories/v2/world.json?api-key=${NYT_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.results) {
      world = data.results.slice(0, 7).map((item) => ({
        title: item.title,
        url: item.url,
        image: item.multimedia?.[0]?.url || DEFAULT_IMG,
        tag: "World",
        date: item.published_date?.split("T")[0],
        description: item.abstract || "",
        body: item.abstract || "",
      }));
    }
    saveJSON(FILES.worldnews, world);
    console.log("🌍 World News saved:", world.length);
  } catch (err) {
    console.error("❌ World error:", err.message);
  }
}

async function fetchTech() {
  let tech = [];
  try {
    const url = "https://techcrunch.com/wp-json/wp/v2/posts?per_page=7&_embed";
    const res = await fetch(url);
    const data = await res.json();
    if (Array.isArray(data)) {
      tech = data.map((item) => ({
        title: item.title?.rendered,
        url: item.link,
        image: item._embedded?.["wp:featuredmedia"]?.[0]?.source_url || DEFAULT_IMG,
        tag: "Tech",
        date: item.date.split("T")[0],
        description: stripTags(item.excerpt?.rendered || ""),
      }));
    }
    saveJSON(FILES.tech, tech);
    console.log("🖥️ Tech homepage saved:", tech.length);
  } catch (err) {
    console.error("❌ Tech homepage error:", err.message);
  }
}

// =============================
// Category Pages
// =============================
async function fetchTechPage() {
  let techPage = [];
  try {
    const url = `https://gnews.io/api/v4/top-headlines?token=${GNEWS_KEY}&topic=technology&lang=en&country=us&max=7`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.articles) {
      techPage = data.articles.map((item) => ({
        title: item.title,
        url: item.url,
        image: item.image || DEFAULT_IMG,
        tag: "Tech",
        date: item.publishedAt?.split("T")[0],
        description: item.description || "",
        body: item.content || "",
      }));
    }
    saveJSON(FILES.techp, techPage);
    console.log("📰 Tech page saved:", techPage.length);
  } catch (err) {
    console.error("❌ Tech page error:", err.message);
  }
}

async function fetchPolitics() {
  let politics = [];
  const rss1 = await fetchRSSFeed("http://feeds.bbci.co.uk/news/politics/rss.xml", "Politics");
  const rss2 = await fetchRSSFeed("https://www.politico.com/rss/politics08.xml", "Politics");
  politics = [...rss1, ...rss2].slice(0, 7);
  saveJSON(FILES.politicsp, politics);
  console.log("🏛️ Politics saved:", politics.length);
}

async function fetchEntertainment() {
  let ent = [];
  const rss1 = await fetchRSSFeed("https://variety.com/feed/", "Entertainment");
  const rss2 = await fetchRSSFeed("https://www.hollywoodreporter.com/c/film/feed/", "Entertainment");
  ent = [...rss1, ...rss2].slice(0, 7);
  saveJSON(FILES.entertainmentp, ent);
  console.log("🎬 Entertainment saved:", ent.length);
}

async function fetchFinancePage() {
  let financep = [];
  const rss1 = await fetchRSSFeed("https://www.investing.com/rss/news.rss", "Finance");
  const rss2 = await fetchRSSFeed("https://www.nasdaq.com/feed/rssoutbound?category=Finance", "Finance");
  financep = [...rss1, ...rss2].slice(0, 7);
  saveJSON(FILES.financep, financep);
  console.log("📈 Finance page saved:", financep.length);
}

async function fetchMusic() {
  let music = [];
  const rss1 = await fetchRSSFeed("https://www.theguardian.com/music/rss", "Music");
  const rss2 = await fetchRSSFeed("https://pitchfork.com/rss/news/", "Music");
  music = [...rss1, ...rss2].slice(0, 7);
  saveJSON(FILES.musicp, music);
  console.log("🎵 Music saved:", music.length);
}

async function fetchLife() {
  let life = [];
  const rss1 = await fetchRSSFeed("https://www.mindbodygreen.com/rss", "Life");
  const rss2 = await fetchRSSFeed("https://lifehacker.com/rss", "Life");
  life = [...rss1, ...rss2].slice(0, 7);

  if (life.length === 0) {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_KEY}`);
      const data = await res.json();
      life = (data.results || []).slice(0, 7).map((it) => ({
        title: it.title || it.name,
        url: `https://www.themoviedb.org/movie/${it.id}`,
        image: it.poster_path ? `https://image.tmdb.org/t/p/w500${it.poster_path}` : DEFAULT_IMG,
        tag: "Life",
        date: it.release_date || new Date().toISOString().split("T")[0],
        description: it.overview || "",
        body: it.overview || "",
      }));
    } catch (err) {
      console.error("❌ Life fallback error:", err.message);
    }
  }

  saveJSON(FILES.lifep, life);
  console.log("🌱 Life saved:", life.length);
}

// =============================
// Runner
// =============================
(async () => {
  await fetchFinance();       // homepage
  await fetchTrending();      // homepage
  await fetchWorldNews();     // homepage
  await fetchTech();          // homepage
  await fetchTechPage();      // tech page
  await fetchPolitics();      // politics
  await fetchEntertainment(); // entertainment
  await fetchFinancePage();   // finance page
  await fetchMusic();         // music
  await fetchLife();          // life
  console.log("✅ All data fetched & saved.");
})();
