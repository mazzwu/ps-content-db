export default async function handler(req, res) {
  try {
    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.AZURE_CLIENT_ID,
          client_secret: process.env.AZURE_CLIENT_SECRET,
          scope: 'https://graph.microsoft.com/.default',
        }),
      }
    );
    const { access_token } = await tokenRes.json();

    const graphRes = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${process.env.SHAREPOINT_SITE_ID}/drives/${process.env.SHAREPOINT_DRIVE_ID}/items/${process.env.EXCEL_FILE_ID}/workbook/tables/${process.env.EXCEL_TABLE_NAME}/rows`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const { value } = await graphRes.json();

    const items = value.map((row) => {
      const v = row.values[0];
      return {
        dateAdded: v[0],
        contentType: v[1],
        sourceName: v[2],
        name: v[3],
        excerpt: v[4],
        url: v[5],
        contentSummary: v[6],
        contentCategory: v[7],
      };
    });

    res.setHeader('Cache-Control', 's-maxage=300');
    res.status(200).json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
