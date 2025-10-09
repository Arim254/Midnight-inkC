export default async function handler(req, res) {
  const { code } = req.query;
  const client_id = process.env.GITHUB_CLIENT_ID;
  const client_secret = process.env.GITHUB_CLIENT_SECRET;
  const redirect_uri = 'https://midnight-ink.vercel.app/api/callback';

  if (!code) {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=public_repo`;
    return res.redirect(githubAuthUrl);
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id, client_secret, code, redirect_uri }),
    });
    const data = await response.json();
    if (data.error) {
      return res.status(400).json({ error: data.error_description || data.error });
    }

    // Instead of redirect, render a page that posts the token to the opener (for popup auth)
    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <html>
        <body>
          <script>
            window.opener.postMessage(
              { token: "${data.access_token}", provider: "github" },
              window.location.origin
            );
            window.close();
          </script>
          <p>Authentication successful. You can close this window.</p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).json({ error: 'OAuth process failed', details: error.message });
  }
}