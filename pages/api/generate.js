export default async function handler(req, res) {
  const { tool, formData } = req.body;

  // This turns the selected values into clean bullet points
  const userInputs = Object.values(formData).join('\n- ');

  const fullPrompt = `${tool["System Prompt"] || tool.system_prompt || tool["system prompt"] || ""}

User selected:
- ${userInputs}

Give your recommendations now.`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: fullPrompt }],
      stream: true,
      temperature: 0.7,
      max_tokens: 800
    })
  });

  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(`data: ${new TextDecoder().decode(value)}\n\n`);
  }
  res.write('data: [DONE]\n\n');
  res.end();
}
