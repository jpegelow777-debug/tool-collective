export default async function handler(req, res) {
  const { slug } = req.query;
  const token = process.env.BASEROW_TOKEN;
  const dbId = process.env.NEXT_PUBLIC_BASEROW_DB_ID;

  const response = await fetch(`https://api.baserow.io/api/database/rows/table/${dbId}/?user_field_names=true&filter__field_slug__equal=${slug}`, {
    headers: { Authorization: `Token ${token}` }
  });
  const data = await response.json();
  res.status(200).json(data.results[0] || {});
}
