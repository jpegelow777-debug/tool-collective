export default async function handler(req, res) {
  const { slug } = req.query;
  const token = process.env.BASEROW_TOKEN;
  const tableId = process.env.NEXT_PUBLIC_BASEROW_DB_ID;

  if (!slug) {
    return res.status(400).json({ error: "Slug is required" });
  }

  try {
    let allRows = [];
    let page = 1;
    const size = 200; // Max per page

    while (true) {
      const url = `https://api.baserow.io/api/database/rows/table/${tableId}/?user_field_names=true&page=${page}&size=${size}`;
      const response = await fetch(url, {
        headers: { Authorization: `Token ${token}` }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Baserow error (page ${page}):`, response.status, errorText);
        throw new Error(`Baserow ${response.status}`);
      }

      const data = await response.json();
      allRows = [...allRows, ...data.results];

      console.log(`Fetched page ${page}: ${data.results.length} rows (total: ${allRows.length})`);

      if (!data.next) break; // No more pages
      page++;
    }

    // Find the tool by slug (case-insensitive, multiple field checks)
    const toolRow = allRows.find(row => {
      const possibleSlugs = [
        row.Slug, row.slug, row["Slug"], row["slug"],
        (row.Slug || "").toLowerCase(),
        (row.slug || "").toLowerCase()
      ];
      return possibleSlugs.some(s => s && s.toLowerCase() === slug.toLowerCase());
    });

    if (!toolRow) {
      console.log(`Tool not found for slug: ${slug}`);
      console.log("Available slugs:", allRows.map(r => r.Slug || r.slug || "no-slug"));
      return res.status(404).json({ error: "Tool not found" });
    }

    console.log(`Found tool: ${toolRow.Name} (slug: ${slug})`);
    res.status(200).json(toolRow);
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({ error: "Failed to fetch tool" });
  }
}
