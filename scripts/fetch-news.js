// scripts/fetch-news.js
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const Parser = require("rss-parser");

const parser = new Parser();

// =============================
// API Keys & Constants
// =============================
const NYT_KEY = "Km4KEFpsEyK7TLzU8A2oNYQSNfkPWjfF";
const GNEWS_KEY = "65d2757e623a60f9998207bc26c1083c";
const TMDB_KEY = "f4cbf268afc603fb50cec0a5a40abcc1";
const DEFAULT_IMG = "/assets/images/news/default.jpg";
const DATA_DIR = path.join(__dirname, "../src/data");

// =============================
// File Paths
// =============================
const FILES = {
  finance: path.join(DATA_DIR, "finance.json"),
  trending: path.join(DATA_DIR, "trending.json"),
  worldnews: path.join(DATA_DIR, "worldnews.json"),
  tech: path.join(DATA_DIR, "tech.json"),
  techp: path.join(DATA_DIR, "techp.json"),
  politicsp: path.join(DATA_DIR, "politicsp.json"),
  entertainmentp: path.join(DATA_DIR, "entertainmentp.json"),
  financep: path.join(DATA_DIR, "financep.json"),
  lifep: path.join(DATA_DIR, "lifep.json"),
  sportsp: path.join(DATA_DIR, "sportsp.json"),
  culture: path.join(DATA_DIR, "culture.json"), // Added Culture
};

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// =============================
// Helpers
// =============================
function saveJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function stripTags(html = "") {
  return html ? html.replace(/<[^>]+>/g, "") : "";
}

// Deduplicate articles by title
function dedupeArticles(articles) {
  const seen = new Set();
  return articles.filter(article => {
    if (!article || !article.title) return false;
    const key = article.title.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * NEW: Fetches an RSS feed, then for each item, extracts the full article content and image.
 * This is much more powerful, but slower.
 */
async function fetchAndExtractFromRSS(feedUrl, tag, extract) {
  console.log(`- Fetching RSS feed: ${feedUrl}`);
  try {
    const feed = await parser.parseURL(feedUrl);
    const articles = [];

    // Use Promise.all to fetch article details in parallel for speed
    await Promise.all(feed.items.map(async (item) => {
      if (!item.link) return;

      try {
        const articleData = await extract(item.link);
        if (articleData) {
          articles.push({
            title: articleData.title || item.title,
            url: item.link, // Original source link
            image: articleData.image || item.enclosure?.url || DEFAULT_IMG,
            tag: tag,
            date: (item.isoDate || item.pubDate || new Date().toISOString()),
            description: articleData.description || stripTags(item.contentSnippet || ""),
            body: articleData.content || item.content || "", // Full article content
          });
        }
      } catch (err) {
        // Ignore individual article extraction errors
      }
    }));

    console.log(`  > Found ${articles.length} articles from ${feedUrl}`);
    return articles;
  } catch (err) {
    console.error(`❌ Error fetching primary RSS feed ${feedUrl}:`, err.message);
    return [];
  }
}

// =============================
// Fetch Functions (Now using the new extractor)
// =============================

async function fetchPolitics(extract) {
  const feeds = [
    "http://feeds.reuters.com/Reuters/PoliticsNews",
    "http://www.npr.org/rss/rss.php?id=1014"
  ];
  let allArticles = [];
  for (const url of feeds) {
    allArticles.push(...await fetchAndExtractFromRSS(url, "Politics", extract));
  }
  const politics = dedupeArticles(allArticles).slice(0, 15);
  saveJSON(FILES.politicsp, politics);
  console.log("🏛️ Politics saved:", politics.length);
}

async function fetchEntertainment(extract) {
  const feeds = [
    "https://variety.com/feed/",
    "https://www.tmz.com/rss.xml"
  ];
  let allArticles = [];
  for (const url of feeds) {
    allArticles.push(...await fetchAndExtractFromRSS(url, "Entertainment", extract));
  }
  const ent = dedupeArticles(allArticles).slice(0, 15);
  saveJSON(FILES.entertainmentp, ent);
  console.log("🎬 Entertainment saved:", ent.length);
}

async function fetchLife(extract) {
    const feeds = [
        "https://www.mindbodygreen.com/rss",
        "https://lifehacker.com/rss"
    ];
    let allArticles = [];
    for (const url of feeds) {
      allArticles.push(...await fetchAndExtractFromRSS(url, "Life", extract));
    }
    const life = dedupeArticles(allArticles).slice(0, 15);
    saveJSON(FILES.lifep, life);
    console.log("🌱 Life saved:", life.length);
}

async function fetchSports(extract) {
  const feeds = [
    "https://www.cbssports.com/rss/headlines/",
    "https://sports.yahoo.com/rss/"
  ];
  let allArticles = [];
  for (const url of feeds) {
    allArticles.push(...await fetchAndExtractFromRSS(url, "Sports", extract));
  }
  const sports = dedupeArticles(allArticles).slice(0, 15);
  saveJSON(FILES.sportsp, sports);
  console.log("🏈 Sports saved:", sports.length);
}

async function fetchFinancePage(extract) {
    const feeds = [
        "https://feeds.finance.yahoo.com/rss/2.0/headline?s=yhoo&region=US&lang=en-US",
        "https://www.cnbc.com/id/100003114/device/rss/rss.html"
    ];
    let allArticles = [];
    for (const url of feeds) {
      allArticles.push(...await fetchAndExtractFromRSS(url, "Finance", extract));
    }
    const finance = dedupeArticles(allArticles).slice(0, 15);
    saveJSON(FILES.financep, finance);
    console.log("💰 Finance Page saved:", finance.length);
}

async function fetchCulture(extract) {
    const feeds = [
        "https://rss.nytimes.com/services/xml/rss/nyt/Arts.xml",
        "http://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml"
    ];
    let allArticles = [];
    for (const url of feeds) {
      allArticles.push(...await fetchAndExtractFromRSS(url, "Culture", extract));
    }
    const culture = dedupeArticles(allArticles).slice(0, 7); // Smaller slice for homepage widget
    saveJSON(FILES.culture, culture);
    console.log("🎨 Culture saved:", culture.length);
}

// =============================
// Runner
// =============================
(async () => {
  console.log("--- Starting Data Fetch ---");
  const { extract } = await import("@extractus/article-extractor");
  await Promise.all([
    fetchPolitics(extract),
    fetchEntertainment(extract),
    fetchLife(extract),
    fetchSports(extract),
    fetchFinancePage(extract),
    fetchCulture(extract)
    // NOTE: Keeping original API-based fetches for other sections
    // to avoid making this process too long. They can be converted
    // to the new RSS method if desired.
  ]);
  console.log("--- RSS Feeds Done ---");

  // Keeping these separate as they use different APIs
  // await fetchFinance();       
  // await fetchTrending();      
  // await fetchWorldNews();     
  // await fetchTech();          
  // await fetchTechPage();      

  console.log("✅ All data fetching tasks initiated.");
})();
