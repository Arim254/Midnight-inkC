export default async function handler(req, res) {
  const code = req.query.code;
  const client_id = process.env.GITHUB_CLIENT_ID;
  const client_secret = process.env.GITHUB_CLIENT_SECRET;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

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
      }),
    });

    const data = await response.json();
    if (data.error) {
      return res.status(400).json({ error: data.error_description });
    }

    res.redirect(`/admin/#/callback?token=${data.access_token}`);
  } catch (error) {
    res.status(500).json({ error: 'OAuth process failed', details: error.message });
  }
}
