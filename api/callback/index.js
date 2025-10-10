export default async function handler(req, res) {
  const { code } = req.query;
  const client_id = process.env.GITHUB_CLIENT_ID;
  const client_secret = process.env.GITHUB_CLIENT_SECRET;
  const redirect_uri = 'https://midnight-ink.vercel.app/api/callback';

  if (!code) {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=repo,user`;
    return res.redirect(githubAuthUrl);
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: JSON.stringify({
        client_id,
        client_secret,
        code,
        redirect_uri,
      }),
    });

    const data = await tokenResponse.json();
    if (data.error) {
      return res.status(400).json({ error: data.error_description || data.error });
    }

    // ✅ Return token JSON for Decap CMS
    res.status(200).json({
      token: data.access_token,
      provider: 'github',
    });
  } catch (error) {
    res.status(500).json({ error: 'OAuth process failed', details: error.message });
  }
}