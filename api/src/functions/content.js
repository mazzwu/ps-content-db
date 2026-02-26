import { app } from '@azure/functions';

app.http('content', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'content',
  handler: async (request, context) => {
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
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        context.log('Token acquisition failed:', JSON.stringify(tokenData));
        return {
          status: 500,
          jsonBody: { error: 'Token failed', details: tokenData },
        };
      }

      const graphUrl = `https://graph.microsoft.com/v1.0/sites/${process.env.SHAREPOINT_SITE_ID}/drives/${process.env.SHAREPOINT_DRIVE_ID}/items/${process.env.EXCEL_FILE_ID}/workbook/tables/${process.env.EXCEL_TABLE_NAME}/rows`;

      const graphRes = await fetch(graphUrl, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const graphData = await graphRes.json();

      if (!graphData.value) {
        context.log('Graph API failed:', JSON.stringify(graphData));
        return {
          status: 500,
          jsonBody: { error: 'Graph API failed', details: graphData },
        };
      }

      const items = graphData.value.map((row) => {
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

      return {
        status: 200,
        headers: { 'Cache-Control': 's-maxage=300' },
        jsonBody: items,
      };
    } catch (err) {
      context.log('Function error:', err.message);
      return {
        status: 500,
        jsonBody: { error: err.message },
      };
    }
  },
});
