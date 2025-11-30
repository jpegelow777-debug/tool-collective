export default async function handler(req, res) {
  const { slug } = req.query;
  const token = process.env.BASEROW_TOKEN;
  const dbId = process.env.NEXT_PUBLIC_BASEROW_DB_ID;

  try {
    const response = await fetch(
      `https://api.baserow.io/api/database/rows/table/${dbId}/?user_field_names=true`,
      { headers: { Authorization: `Token ${token}` } }
    );
    const data = await response.json();

    // This searches EVERY possible way Baserow might name the field
    const toolRow = data.results.find(row => {
      return (
        (row.Slug || row.slug || row["Slug"] || row["slug"])?.toLowerCase() === slug.toLowerCase()
      );
    });

    if (!toolRow) {
      console.log("Available rows:", data.results.map(r => ({ name: r.Name, slug: r.Slug || r.slug })));
      return res.status(404).json({ error: "Tool not found" });
    }

    res.status(200).json(toolRow);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
