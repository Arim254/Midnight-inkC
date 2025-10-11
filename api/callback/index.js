export default async function handler(req, res) {
  try {
    const { code } = req.query;
    const client_id = process.env.GITHUB_CLIENT_ID;
    const client_secret = process.env.GITHUB_CLIENT_SECRET;

    const isLocal = process.env.VERCEL === undefined;
    const baseUrl = isLocal
      ? 'http://localhost:3000'
      : 'https://midnight-ink.vercel.app';
    const redirect_uri = `${baseUrl}/api/callback`;

    if (!code) {
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(
        redirect_uri
      )}&scope=repo,user`;
      return res.redirect(githubAuthUrl);
    }

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

    const token = tokenData.access_token;

    // ✅ Send token back to Decap CMS parent window
    const html = `
      <html>
        <body>
          <script>
            (function() {
              function receiveMessage(e) {
                console.log("Sending token to Decap CMS...");
                window.opener.postMessage(
                  'authorization:github:success:${token}',
                  '*'
                );
                window.close();
              }
              receiveMessage();
            })();
          </script>
          <p>Authentication completed. This window should close automatically.</p>
        </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);

  } catch (error) {
    res.status(500).json({
      error: 'OAuth process failed',
      details: error.message,
    });
  }
}
