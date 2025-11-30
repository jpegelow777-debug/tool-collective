
export default async function handler(req, res) {
  const { slug } = req.query;
  const token = process.env.BASEROW_TOKEN;
  const tableId = process.env.NEXT_PUBLIC_BASEROW_DB_ID; // 757356 for you

  try {
    const response = await fetch(
      `https://api.baserow.io/api/database/rows/table/${tableId}/?user_field_names=true&size=200`,
      { headers: { Authorization: `Token ${token}` } }
    );

    console.log(`Baserow status: ${response.status}`); // Log status

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Baserow error details: ${errorText}`);
      throw new Error(`Baserow ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Fetched rows: ${data.results.length}`); // Log count

    // Log all rows' names and slugs for debugging
    console.log("All rows:", data.results.map(r => ({ name: r.Name, slug: r.Slug || r.slug || 'no-slug' })));

    // Search for slug in all possible field names/cases
    const toolRow = data.results.find(row => {
      const possibleSlugs = [
        row.Slug, row.slug, row["Slug"], row["slug"], 
        row.Slug, row["slug"], row.name, row.Name // Extra checks
      ];
      const match = possibleSlugs.some(s => s && s.toLowerCase() === slug.toLowerCase());
      if (match) console.log("Match found for slug:", slug);
      return match;
    });

    if (!toolRow) {
      console.log("No match for slug:", slug);
      return res.status(404).json({ error: "Tool not found", availableSlugs: data.results.map(r => r.Slug || r.slug || 'no-slug') });
    }

    console.log("Returning tool:", toolRow.Name);
    res.status(200).json(toolRow);
  } catch (error) {
    console.error("Full error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
