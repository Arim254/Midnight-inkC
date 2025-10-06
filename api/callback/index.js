// api/callback/index.js
const axios = require('axios');
const { URLSearchParams } = require('url');

module.exports = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    res.status(400).send('Missing authorization code');
    return;
  }

  try {
    const params = new URLSearchParams();
    params.append('client_id', process.env.GITHUB_CLIENT_ID);
    params.append('client_secret', process.env.GITHUB_CLIENT_SECRET);
    params.append('code', code);

    const response = await axios.post('https://github.com/login/oauth/access_token', params.toString(), {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data.error) {
      res.status(400).send(`GitHub error: ${response.data.error_description}`);
      return;
    }

    const accessToken = response.data.access_token;
    const state = req.query.state;

    // Redirect back to the CMS with the access token
    res.redirect(`/admin/#access_token=${accessToken}&provider=github&state=${state}`);
  } catch (err) {
    res.status(500).send('Authentication failed');
  }
};