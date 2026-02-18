export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

  try {
    // Get access token
    const tokenResponse = await fetch(
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

    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;

    if (!token) {
      return res.status(500).json({ error: 'Failed to obtain access token' });
    }

    // Fetch table rows from Excel
    const graphResponse = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${process.env.SHAREPOINT_SITE_ID}/drives/${process.env.SHAREPOINT_DRIVE_ID}/items/${process.env.EXCEL_FILE_ID}/workbook/tables/${process.env.EXCEL_TABLE_NAME}/rows`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const graphData = await graphResponse.json();

    if (!graphData.value) {
      return res.status(500).json({ error: 'No data returned from Excel' });
    }

    // Map rows to frontend data shape
    const items = graphData.value.map((row, index) => {
      const v = row.values[0];
      return {
        id: index + 1,
        dateAdded: v[0] || '',
        contentType: v[1] || '',
        sourceName: v[2] || '',
        name: v[3] || '',
        excerpt: v[4] || '',
        url: v[5] || '',
        contentSummary: v[6] || '',
        contentCategory: v[7] || '',
        tagKeywords: v[8] || '',
      };
    });

    res.status(200).json(items);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
