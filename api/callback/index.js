export default async function handler(req, res) {
  const { code } = req.query;
  const client_id = process.env.GITHUB_CLIENT_ID;
  const client_secret = process.env.GITHUB_CLIENT_SECRET;
  const host = req.headers.host;
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  const redirect_uri = `${protocol}://${host}/api/callback`;

  if (!code) {
    // Step 1: Redirect user to GitHub OAuth
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=public_repo`;
    return res.redirect(githubAuthUrl);
  }

  // Step 2: Got code, exchange for token
  try {
    const response = await fetch(`https://github.com/login/oauth/access_token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code,
        redirect_uri,
      }),
    });

    const data = await response.json();
    if (data.error) {
      return res.status(400).json({ error: data.error_description || data.error });
    }

    // Redirect CMS to admin with the token
    res.redirect(`/admin/#/callback?token=${data.access_token}`);
  } catch (error) {
    res.status(500).json({ error: 'OAuth process failed', details: error.message });
  }
}