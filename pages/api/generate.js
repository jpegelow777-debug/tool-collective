export default async function handler(req, res) {
  try {
    const { tool, formData } = req.body || {};

    // Safely get system prompt
    const rawPrompt =
      tool?.["System Prompt"] ||
      tool?.system_prompt ||
      tool?.["system prompt"] ||
      "";

    // Format user inputs
    const userInputs = Object.values(formData || {})
      .filter(Boolean)
      .map(v => `- ${v}`)
      .join('\n');

    const fullPrompt = `${rawPrompt}

User selected:
${userInputs || "No options selected"}

Respond ONLY in clean, readable markdown. Use headings, numbered lists, and bold where it makes sense. Never output raw JSON or code blocks.`;

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5.4-nano',
        input: fullPrompt,
        stream: true,
        temperature: 0.7,
        max_output_tokens: 1500
      })
    });

    // Handle API errors (VERY IMPORTANT)
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI Error:', errorText);
      res.write(`data: ${JSON.stringify({ error: 'API request failed' })}\n\n`);
      res.end();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const json = JSON.parse(line.slice(6));

            // ✅ Correct token extraction for Responses API
            let token = '';

            if (json.type === 'response.output_text.delta') {
              token = json.delta;
            }

            if (token) {
              // Transform into chat-completions format for your frontend
              res.write(
                `data: ${JSON.stringify({
                  choices: [{ delta: { content: token } }]
                })}\n\n`
              );
            }
          } catch (e) {
            // Ignore malformed chunks
          }
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).end();
  }
}
