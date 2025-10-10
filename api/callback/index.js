export default async function handler(req, res) {
  try {
    const { code } = req.query;
    const client_id = process.env.GITHUB_CLIENT_ID;
    const client_secret = process.env.GITHUB_CLIENT_SECRET;

    // Detect environment (Vercel or localhost)
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const redirect_uri = `${baseUrl}/api/callback`;

    // 1️⃣ If no code, redirect to GitHub OAuth
    if (!code) {
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(
        redirect_uri
      )}&scope=repo,user`;
      return res.redirect(githubAuthUrl);
    }

    // 2️⃣ Exchange code for token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ client_id, client_secret, code, redirect_uri }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error_description || tokenData.error });
    }

    // 3️⃣ Return token (Decap CMS expects this)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ token: tokenData.access_token });
  } catch (error) {
    res.status(500).json({ error: 'OAuth process failed', details: error.message });
  }
}
