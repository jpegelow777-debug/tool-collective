export default async function handler(req, res) {
  const { tool, formData } = req.body;

  // Grab the system prompt no matter how the column is capitalised
  const rawPrompt = tool["System Prompt"] || tool.system_prompt || tool["system prompt"] || "";

  // Clean user inputs — only the values, bulleted
  const userInputs = Object.values(formData)
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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: fullPrompt }],
      stream: true,
      temperature: 0.7,
      max_tokens: 1000
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
          const token = json.choices?.[0]?.delta?.content || '';
          if (token) res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: token } }] })}\n\n`);
        } catch {}
      }
    }
  }
  res.write('data: [DONE]\n\n');
  res.end();
}
