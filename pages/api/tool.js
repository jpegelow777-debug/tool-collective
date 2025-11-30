export default async function handler(req, res) {
  const { slug } = req.query;
  const token = process.env.BASEROW_TOKEN;
  const dbId = process.env.NEXT_PUBLIC_BASEROW_DB_ID;

  try {
    const response = await fetch(`https://api.baserow.io/api/database/rows/table/${dbId}/?user_field_names=true`, {
      headers: { Authorization: `Token ${token}` }
    });
    if (!response.ok) throw new Error(`Baserow error: ${response.status}`);
    const data = await response.json();
    
    // Filter in code by slug (case-insensitive)
    const toolRow = data.results.find(row => row.Slug && row.Slug.toLowerCase() === slug.toLowerCase());
    
    if (!toolRow) {
      return res.status(404).json({ error: 'Tool not found' });
    }
    
    res.status(200).json(toolRow);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch tool' });
  }
}
