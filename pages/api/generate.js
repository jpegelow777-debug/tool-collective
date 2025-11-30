export default async function handler(req, res) {
  const { tool, formData } = req.body;
  const userInputs = Object.entries(formData).map(([k, v]) => `${k}: ${v}`).join('\n');
  const prompt = `${tool['System Prompt']}\n\nUser inputs:\n${userInputs}`;

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
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      temperature: 0.7
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
