// api/callback/index.js
const axios = require('axios');
const { URLSearchParams } = require('url');

module.exports = async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    });

    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      params.toString(),
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data.error) {
      return res.status(400).send(`GitHub error: ${response.data.error_description}`);
    }

    const accessToken = response.data.access_token;

    // Redirect back to Decap CMS
    return res.redirect(`/admin/#access_token=${accessToken}&provider=github&state=${state}`);
  } catch (error) {
    console.error('OAuth error:', error.response?.data || error.message);
    return res.status(500).send('Authentication failed');
  }
};
