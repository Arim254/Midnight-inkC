const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// =============================
// Constants
// =============================
const RAPIDAPI_KEY = 'b79f32ab61msh9080ce27557388bp1e4426jsn7794fb51a6ca';
const SEO_MASTERMIND_HOST = 'seo-mastermind-ai-keyword-meta-title-generator.p.rapidapi.com';
const SEO_MASTERMIND_URL = 'https://seo-mastermind-ai-keyword-meta-title-generator.p.rapidapi.com/seo';
const DATA_DIR = path.join(__dirname, '../src/data');
const SITE_URL = 'https://midnight-ink.netlify.app/'; // Replace with your actual site URL

// =============================
// Helper Functions
// =============================

/**
 * Generates NewsArticle JSON-LD schema.
 * @param {object} articleData - The article data.
 * @returns {object} The JSON-LD schema.
 */
function generateNewsSchema(articleData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': articleData.title,
    'image': [
      articleData.image,
     ],
    'datePublished': articleData.date,
    'dateModified': articleData.date,
    'author': [{
        '@type': 'Person',
        'name': 'Midnight Ink Staff'
      }]
  };
}

/**
 * Pings Google with the sitemap URL.
 */
async function pingGoogle() {
  const sitemapUrl = `${SITE_URL}/sitemap.xml`;
  try {
    await fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`);
    console.log('Successfully pinged Google with sitemap.');
  } catch (error) {
    console.error('Error pinging Google:', error);
  }
}

/**
 * Generates and saves a sitemap.xml file.
 * @param {array} allArticles - An array of all articles from all data files.
 */
function updateSitemap(allArticles) {
  const sitemapPath = path.join(__dirname, '../_site/sitemap.xml');
  let sitemapContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemapContent += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  allArticles.forEach(article => {
    sitemapContent += '  <url>\n';
    sitemapContent += `    <loc>${article.url}</loc>\n`;
    sitemapContent += `    <lastmod>${new Date(article.date).toISOString()}</lastmod>\n`;
    sitemapContent += '  </url>\n';
  });

  sitemapContent += '</urlset>';
  fs.writeFileSync(sitemapPath, sitemapContent);
  console.log('Sitemap updated successfully.');
}

// =============================
// Main SEO Workflow
// =============================

async function optimizeSeo() {
  console.log('--- Starting SEO Optimization ---');

  const filesToProcess = [
    'trending.json',
    'worldnews.json',
    'tech.json',
    'culture.json',
    'sportsp.json',
    'financep.json',
    'politicsp.json',
    'entertainmentp.json',
    'lifep.json'
  ];

  let allArticles = [];

  for (const fileName of filesToProcess) {
    const filePath = path.join(DATA_DIR, fileName);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const articles = JSON.parse(fileContent);

    const optimizedArticles = [];

    for (const article of articles) {
      const payload = { topic: article.title };
      const options = {
        method: 'POST',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': SEO_MASTERMIND_HOST,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      };

      let optimizedArticle = { ...article };

      try {
        const response = await fetch(SEO_MASTERMIND_URL, options);
        const result = await response.json();
        if (result.seo_title && result.meta_description) {
          optimizedArticle.title = result.seo_title;
          optimizedArticle.description = result.meta_description;
          console.log(`Successfully optimized: ${article.title}`);
        } else {
          throw new Error('Invalid API response');
        }
      } catch (error) {
        console.error(`RapidAPI Error for "${article.title}":`, error.message, '. Using fallback.');
        // Fallback logic
        optimizedArticle.description = optimizedArticle.body ? optimizedArticle.body.substring(0, 150) : '';
      }

      optimizedArticle.schema = generateNewsSchema(optimizedArticle);
      optimizedArticles.push(optimizedArticle);
    }

    fs.writeFileSync(filePath, JSON.stringify(optimizedArticles, null, 2));
    console.log(`Successfully optimized and saved ${fileName}`);
    allArticles = allArticles.concat(optimizedArticles);
  }

  updateSitemap(allArticles);
  await pingGoogle();

  console.log('--- SEO Optimization Complete ---');
}

optimizeSeo();
