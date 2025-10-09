export default async function handler(req, res) {
  const { code } = req.query;
  const client_id = process.env.GITHUB_CLIENT_ID;
  const client_secret = process.env.GITHUB_CLIENT_SECRET;
  const redirect_uri = 'https://midnight-ink.vercel.app/api/callback';

  // If no code, start the OAuth flow
  if (!code) {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&scope=public_repo`;
    return res.redirect(githubAuthUrl);
  }

  try {
    // Exchange the code for an access token
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id, client_secret, code, redirect_uri }),
    });

    const data = await response.json();
    if (data.error) {
      return res.status(400).json({ error: data.error_description || data.error });
    }

    // Render HTML that navigates the opener (parent) to the Decap callback URL with the token.
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<!doctype html>
<html>
  <head><meta charset="utf-8" /></head>
  <body>
    <script>
      (function() {
        const token = "${data.access_token}";
        try {
          // If opened as a popup from the CMS admin, navigate the opener window to the callback URL
          if (window.opener && !window.opener.closed) {
            window.opener.location.href = "/admin/#/callback?token=" + encodeURIComponent(token);
            setTimeout(() => window.close(), 600);
          } else {
            // No opener (direct), navigate this window to the admin callback route
            window.location.href = "/admin/#/callback?token=" + encodeURIComponent(token);
          }
        } catch (err) {
          document.body.innerText = "Authentication complete. If nothing happened, paste this URL in your browser: /admin/#/callback?token=" + token;
        }
      })();
    </script>
    <p>Authentication completed. This window should close automatically.</p>
  </body>
</html>`);
  } catch (error) {
    res.status(500).json({ error: 'OAuth process failed', details: error.message });
  }
}