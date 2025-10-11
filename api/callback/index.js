export default async function handler(req, res) {
  try {
    const { code } = req.query;
    const client_id = process.env.GITHUB_CLIENT_ID;
    const client_secret = process.env.GITHUB_CLIENT_SECRET;

    // 🔍 Detect environment
    const isLocal = process.env.VERCEL === undefined;
    const baseUrl = isLocal
      ? 'http://localhost:3000'
      : 'https://midnight-ink.vercel.app';

    const redirect_uri = `${baseUrl}/api/callback`;

    // 1️⃣ If no code, redirect user to GitHub OAuth
    if (!code) {
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(
        redirect_uri
      )}&scope=repo,user`;
      return res.redirect(githubAuthUrl);
    }

    // 2️⃣ Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
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

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({
        error: tokenData.error_description || tokenData.error,
      });
    }

    // 3️⃣ Return token to Decap CMS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ token: tokenData.access_token });
  } catch (error) {
    // 4️⃣ Handle unexpected issues gracefully
    res.status(500).json({
      error: 'OAuth process failed',
      details: error.message,
    });
  }
}
