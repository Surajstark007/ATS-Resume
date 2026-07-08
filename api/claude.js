// Server-side proxy for Anthropic calls. Keeps ANTHROPIC_API_KEY out of the browser.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Server is not configured with an Anthropic API key.' });
    return;
  }

  const { messages, max_tokens, model } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages is required' });
    return;
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-6',
        max_tokens: max_tokens || 2000,
        messages,
      }),
    });

    const data = await anthropicRes.json();
    res.status(anthropicRes.status).json(data);
  } catch (err) {
    console.error('[api/claude]', err);
    res.status(502).json({ error: 'Failed to reach Anthropic API' });
  }
}
