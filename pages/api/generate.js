export default async function handler(req, res) {
  const { tool, formData } = req.body;

  const rawPrompt =
    tool["System Prompt"] ||
    tool.system_prompt ||
    tool["system prompt"] ||
    "";

  const userInputs = Object.values(formData || {})
    .filter(Boolean)
    .map(v => `- ${v}`)
    .join('\n');

  const fullPrompt = `${rawPrompt}

User selected:
${userInputs || "No options selected"}

Respond ONLY in clean, readable markdown. Use headings, numbered lists, and bold where it makes sense. Never output raw JSON or code blocks.`;

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

          // NEW PATH for Responses API
          const token =
            json.output_text ||
            json.delta?.output_text ||
            json.output?.[0]?.content?.[0]?.text ||
            '';

          if (token) {
            res.write(
              `data: ${JSON.stringify({
                choices: [{ delta: { content: token } }]
              })}\n\n`
            );
          }
        } catch (e) {
          // ignore malformed chunks
        }
      }
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();
}
