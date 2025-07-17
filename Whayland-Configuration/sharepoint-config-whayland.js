// Whayland Company - SharePoint API Configuration
// This file contains Whayland-specific SharePoint site URLs and configurations

export class WhaylandSharePointAPI {
  constructor() {
    // Whayland SharePoint Configuration
    this.siteUrl = 'https://whaylandcompany.sharepoint.com/sites/DailyReports'; // Replace with actual Whayland site URL
    this.listsConfig = {
      projects: {
        name: 'Projects',
        url: `${this.siteUrl}/_api/web/lists/getbytitle('Projects')`
      },
      dailyReports: {
        name: 'Daily Reports',
        url: `${this.siteUrl}/_api/web/lists/getbytitle('Daily Reports')`
      }
    };
  }

  async getProjects(accessToken) {
    try {
      const response = await fetch(`${this.listsConfig.projects.url}/items?$select=Id,Title,ProjectName,StreetAddress,City,State,ZipCode,ProjectManager,Superintendent,Owner`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json;odata=verbose'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.d.results;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  async saveDailyReport(reportData, accessToken) {
    try {
      const response = await fetch(`${this.listsConfig.dailyReports.url}/items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': await this.getRequestDigest(accessToken)
        },
        body: JSON.stringify({
          __metadata: { type: 'SP.Data.Daily_x0020_ReportsListItem' },
          Title: reportData.title,
          ProjectId: reportData.projectId,
          ReportDate: reportData.date,
          Weather: reportData.weather,
          Temperature: reportData.temperature,
          SiteVisitors: JSON.stringify(reportData.siteVisitors),
          Subcontractors: JSON.stringify(reportData.subcontractors),
          Deliveries: JSON.stringify(reportData.deliveries),
          UtilitiesOrdered: reportData.utilitiesOrdered,
          UtilitiesInstalled: reportData.utilitiesInstalled,
          UtilitiesRemoved: reportData.utilitiesRemoved,
          SuperintendentNotes: reportData.notes,
          Superintendent: reportData.superintendent
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving daily report:', error);
      throw error;
    }
  }

  async uploadFile(file, fileName, accessToken) {
    try {
      const response = await fetch(`${this.siteUrl}/_api/web/GetFolderByServerRelativeUrl('/Shared Documents')/Files/add(url='${fileName}',overwrite=true)`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json;odata=verbose',
          'X-RequestDigest': await this.getRequestDigest(accessToken)
        },
        body: file
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async getRequestDigest(accessToken) {
    try {
      const response = await fetch(`${this.siteUrl}/_api/contextinfo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json;odata=verbose'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.d.GetContextWebInformation.FormDigestValue;
    } catch (error) {
      console.error('Error getting request digest:', error);
      throw error;
    }
  }
}

export default WhaylandSharePointAPI;
