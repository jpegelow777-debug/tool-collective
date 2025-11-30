export default async function handler(req, res) {
  const { slug } = req.query;
  const token = process.env.BASEROW_TOKEN;
  const dbId = process.env.NEXT_PUBLIC_BASEROW_DB_ID; // 329766 for you

  try {
    const response = await fetch(
      `https://api.baserow.io/api/database/rows/table/${dbId}/?user_field_names=true&size=200`,
      { headers: { Authorization: `Token ${token}` } }
    );
    if (!response.ok) throw new Error(`Baserow ${response.status}`);
    const data = await response.json();

    // This line is the fix — field names in Baserow are Title Case
    const toolRow = data.results.find(row => 
      row.Slug?.toLowerCase() === slug.toLowerCase() ||
      row["Slug"]?.toLowerCase() === slug.toLowerCase()
    );

    if (!toolRow) {
      console.log("Rows found:", data.results.length, "but no slug match for", slug);
      return res.status(404).json({ error: "Tool not found" });
    }

    res.status(200).json(toolRow);
  } catch (error) {
    console.error("Baserow error:", error.message);
    res.status(500).json({ error: "Failed to fetch" });
  }
}
