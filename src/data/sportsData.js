const fetch = require('node-fetch');

module.exports = async function() {
  // IMPORTANT: It is not recommended to hardcode API keys in your code.
  // Consider using environment variables for better security.
  const apiKey = '014722bc56e43e13636ec56e6ed572b4';
  const url = 'https://v3.football.api-sports.io/fixtures?live=all';

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey
      }
    });

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return { response: [] };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching sports data:", error);
    // Return empty data on error so the site can still build
    return { response: [] };
  }
};
