// SharePoint API Integration
// This handles all SharePoint list operations for the Daily Report

import { getAccessToken } from './msal-config.js';

// SharePoint configuration - You'll need to update these values
const SHAREPOINT_SITE_URL = "YOUR_SHAREPOINT_SITE_URL"; // e.g., "https://yourcompany.sharepoint.com/sites/yoursite"
const PROJECTS_LIST_NAME = "Projects";

class SharePointAPI {
    constructor() {
        this.baseUrl = `${SHAREPOINT_SITE_URL}/_api/web`;
    }

    async makeRequest(endpoint, options = {}) {
        try {
            const token = await getAccessToken();
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('SharePoint API error:', error);
            throw error;
        }
    }

    // Get all projects from the Projects list
    async getProjects() {
        try {
            const endpoint = `/lists/getbytitle('${PROJECTS_LIST_NAME}')/items?$select=Title,ProjectName,StreetAddress,City,State,ZipCode,ProjectManager,Superintendent,Owner`;
            const response = await this.makeRequest(endpoint);
            return response.d.results.map(item => ({
                id: item.Id,
                jobNumber: item.Title,
                projectName: item.ProjectName,
                streetAddress: item.StreetAddress,
                city: item.City,
                state: item.State,
                zipCode: item.ZipCode,
                projectManager: item.ProjectManager,
                superintendent: item.Superintendent,
                owner: item.Owner
            }));
        } catch (error) {
            console.error('Error fetching projects:', error);
            return [];
        }
    }

    // Get project by job number (Title field)
    async getProjectByJobNumber(jobNumber) {
        try {
            const endpoint = `/lists/getbytitle('${PROJECTS_LIST_NAME}')/items?$filter=Title eq '${jobNumber}'&$select=Title,ProjectName,StreetAddress,City,State,ZipCode,ProjectManager,Superintendent,Owner`;
            const response = await this.makeRequest(endpoint);
            if (response.d.results.length > 0) {
                const item = response.d.results[0];
                return {
                    id: item.Id,
                    jobNumber: item.Title,
                    projectName: item.ProjectName,
                    streetAddress: item.StreetAddress,
                    city: item.City,
                    state: item.State,
                    zipCode: item.ZipCode,
                    projectManager: item.ProjectManager,
                    superintendent: item.Superintendent,
                    owner: item.Owner
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching project by job number:', error);
            return null;
        }
    }

    // Save daily report data
    async saveDailyReport(reportData) {
        try {
            // You'll need to create a DailyReports list in SharePoint
            // This is a placeholder for the save functionality
            const endpoint = `/lists/getbytitle('DailyReports')/items`;
            
            const requestDigest = await this.getRequestDigest();
            
            const response = await this.makeRequest(endpoint, {
                method: 'POST',
                headers: {
                    'X-RequestDigest': requestDigest
                },
                body: JSON.stringify({
                    '__metadata': { 'type': 'SP.Data.DailyReportsListItem' },
                    ...reportData
                })
            });

            return response.d;
        } catch (error) {
            console.error('Error saving daily report:', error);
            throw error;
        }
    }

    // Get request digest for POST operations
    async getRequestDigest() {
        try {
            const response = await this.makeRequest('/contextinfo', {
                method: 'POST'
            });
            return response.d.GetContextWebInformation.FormDigestValue;
        } catch (error) {
            console.error('Error getting request digest:', error);
            throw error;
        }
    }

    // Upload file (for photo gallery and packing slips)
    async uploadFile(file, libraryName, fileName) {
        try {
            const token = await getAccessToken();
            const endpoint = `${SHAREPOINT_SITE_URL}/_api/web/lists/getbytitle('${libraryName}')/RootFolder/Files/Add(url='${fileName}',overwrite=true)`;
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/octet-stream'
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
}

// Export singleton instance
export const sharePointAPI = new SharePointAPI();
