// SharePoint API Integration using Microsoft Graph API
// This handles all SharePoint list operations for the Daily Report

import { getAccessToken } from './msal-config.js';
import weatherService from './weather-service.js';

// SharePoint configuration - Update these values for your environment
const SHAREPOINT_SITE_URL = "https://whaylandco.sharepoint.com/sites/DailyReports"; // Update this to your SharePoint site
const PROJECTS_LIST_NAME = "Projects";
const DAILY_REPORTS_LIST_NAME = "DailyReports";

class SharePointAPI {
    // Test method: fetch and log filtered daily reports
    async testGetFilteredDailyReports() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const filters = { startDate: today, endDate: today };
            const reports = await this.getFilteredDailyReports(filters);
            console.log('Test: Filtered daily reports for today:', reports);
            console.log(`Fetched ${reports.length} daily report(s) for today. See details above.`);
            return reports;
        } catch (err) {
            console.error('Test failed:', err);
            console.log('Test failed: ' + err.message);
        }
    }
    // Fetch daily reports filtered by project, superintendent, and date range for PDF/reporting
    async getFilteredDailyReports(filters) {
        try {
            const siteId = await this.getSiteId();
            // Get the DailyReports list
            const listsResponse = await this.makeRequest(`/sites/${siteId}/lists?$filter=displayName eq '${DAILY_REPORTS_LIST_NAME}'`);
            if (!listsResponse.value || listsResponse.value.length === 0) {
                throw new Error(`DailyReports list '${DAILY_REPORTS_LIST_NAME}' not found`);
            }
            const listId = listsResponse.value[0].id;

            // Build OData filter string
            let filterParts = [];
            if (filters.projectId) filterParts.push(`fields/ProjectId eq '${filters.projectId}'`);
            if (filters.superintendent) filterParts.push(`fields/Superintendent eq '${filters.superintendent.replace(/'/g, "''")}'`);
            if (filters.startDate) filterParts.push(`fields/ReportDate ge '${filters.startDate}'`);
            if (filters.endDate) filterParts.push(`fields/ReportDate le '${filters.endDate}'`);
            const filterString = filterParts.length ? `&$filter=${filterParts.join(' and ')}` : '';

            // Query list items (expand fields)
            const itemsResponse = await this.makeRequest(`/sites/${siteId}/lists/${listId}/items?$expand=fields${filterString}&$top=1000`);

            // Map SharePoint items to report structure
            return itemsResponse.value.map(item => {
                const f = item.fields;
                return {
                    reportDate: f.ReportDate,
                    superintendent: f.Superintendent,
                    jobNumber: f.JobNumber || f.Title || '',
                    weatherData: f.WeatherData,
                    siteVisitors: f.SiteVisitors ? JSON.parse(f.SiteVisitors) : [],
                    subcontractors: f.Subcontractors ? JSON.parse(f.Subcontractors) : [],
                    deliveries: f.Deliveries ? JSON.parse(f.Deliveries) : [],
                    photos: f.Photos ? JSON.parse(f.Photos) : [],
                    utilitiesOrdered: f.UtilitiesOrdered,
                    utilitiesRemoved: f.UtilitiesRemoved,
                    superintendentNotes: f.SuperintendentNotes || f.Notes || ''
                };
            });
        } catch (error) {
            console.error('Error fetching filtered daily reports:', error);
            throw error;
        }
    }
    constructor() {
        // Using Microsoft Graph API instead of SharePoint REST API
        this.baseUrl = 'https://graph.microsoft.com/v1.0';
        this.siteId = null;
    }

    async getAccessToken() {
        // Import the function from msal-config
        const { getAccessToken } = await import('./msal-config.js');
        return await getAccessToken();
    }

    async getSiteId() {
        if (this.siteId) {
            return this.siteId;            
        }

        try {
            const token = await getAccessToken();
            
            // For SharePoint sites, we need to use the hostname and relative path format
            // https://whayland.sharepoint.com/sites/DailyReports becomes:
            // hostname: whayland.sharepoint.com
            // path: /sites/DailyReports
            const url = new URL(SHAREPOINT_SITE_URL);
            const hostname = url.hostname;
            const sitePath = url.pathname;
            
            console.log('Getting site ID for:', hostname, sitePath);
            
            const response = await fetch(`${this.baseUrl}/sites/${hostname}:${sitePath}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            const site = await response.json();
            console.log('Site details:', site);
            this.siteId = site.id;
            return this.siteId;
        } catch (error) {
            console.error('Error getting site ID:', error);
            throw error;
        }
    }

    async makeRequest(endpoint, options = {}) {
        try {
            const token = await getAccessToken();
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Graph API error response:', errorText);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
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
            console.log('Fetching projects from SharePoint using Microsoft Graph API...');
            
            const siteId = await this.getSiteId();
            console.log('Site ID:', siteId);
            
            // Get the Projects list
            const listsResponse = await this.makeRequest(`/sites/${siteId}/lists?$filter=displayName eq '${PROJECTS_LIST_NAME}'`);
            
            if (!listsResponse.value || listsResponse.value.length === 0) {
                throw new Error(`Projects list '${PROJECTS_LIST_NAME}' not found`);
            }
            
            const listId = listsResponse.value[0].id;
            console.log('Projects list ID:', listId);
            
            // Get all items from the Projects list
            const itemsResponse = await this.makeRequest(`/sites/${siteId}/lists/${listId}/items?$expand=fields`);
            
            console.log('Raw SharePoint response:', itemsResponse);
            
            return itemsResponse.value.map(item => {
                const fields = item.fields;
                return {
                    id: item.id,
                    jobNumber: fields.Title || '',
                    projectName: fields.ProjectName || '',
                    streetAddress: fields.StreetAddress || '',
                    city: fields.City || '',
                    state: fields.State || '',
                    zipCode: fields.ZipCode || '',
                    projectManager: fields.ProjectManager || '',
                    superintendent: fields.Superintendent || '',
                    owner: fields.Owner || ''
                };
            });
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw error;
        }
    }

    // Get project by job number (Title field)
    async getProjectByJobNumber(jobNumber) {
        try {
            const siteId = await this.getSiteId();
            
            // Get the Projects list
            const listsResponse = await this.makeRequest(`/sites/${siteId}/lists?$filter=displayName eq '${PROJECTS_LIST_NAME}'`);
            
            if (!listsResponse.value || listsResponse.value.length === 0) {
                throw new Error(`Projects list '${PROJECTS_LIST_NAME}' not found`);
            }
            
            const listId = listsResponse.value[0].id;
            
            // Get items filtered by job number (Title field)
            const itemsResponse = await this.makeRequest(`/sites/${siteId}/lists/${listId}/items?$expand=fields&$filter=fields/Title eq '${jobNumber}'`);
            
            if (itemsResponse.value && itemsResponse.value.length > 0) {
                const item = itemsResponse.value[0];
                const fields = item.fields;
                return {
                    id: item.id,
                    jobNumber: fields.Title || '',
                    projectName: fields.ProjectName || '',
                    streetAddress: fields.StreetAddress || '',
                    city: fields.City || '',
                    state: fields.State || '',
                    zipCode: fields.ZipCode || '',
                    projectManager: fields.ProjectManager || '',
                    superintendent: fields.Superintendent || '',
                    owner: fields.Owner || ''
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching project by job number:', error);
            return null;
        }
    }

    // Get the actual columns/fields in the DailyReports list
    async getDailyReportsListColumns() {
        try {
            const siteId = await this.getSiteId();
            
            // Get the DailyReports list
            const listsResponse = await this.makeRequest(`/sites/${siteId}/lists?$filter=displayName eq '${DAILY_REPORTS_LIST_NAME}'`);
            
            if (!listsResponse.value || listsResponse.value.length === 0) {
                throw new Error(`DailyReports list '${DAILY_REPORTS_LIST_NAME}' not found`);
            }
            
            const listId = listsResponse.value[0].id;
            
            // Get all columns in the list
            const columnsResponse = await this.makeRequest(`/sites/${siteId}/lists/${listId}/columns`);
            
            console.log('DailyReports list columns:', columnsResponse.value.map(col => ({
                name: col.name,
                displayName: col.displayName,
                type: col.columnDefinition?.type || 'unknown'
            })));
            
            return columnsResponse.value;
            
        } catch (error) {
            console.error('Error getting DailyReports columns:', error);
            throw error;
        }
    }

    // Save daily report data
    async saveDailyReport(reportData) {
        try {
            console.log('Saving daily report to SharePoint...', reportData);
            
            // First, discover what columns exist in the DailyReports list
            console.log('🔍 Discovering DailyReports list columns...');
            const columns = await this.getDailyReportsListColumns();
            
            const siteId = await this.getSiteId();
            
            // Get the DailyReports list
            const listsResponse = await this.makeRequest(`/sites/${siteId}/lists?$filter=displayName eq '${DAILY_REPORTS_LIST_NAME}'`);
            
            if (!listsResponse.value || listsResponse.value.length === 0) {
                throw new Error(`DailyReports list '${DAILY_REPORTS_LIST_NAME}' not found`);
            }
            
            const listId = listsResponse.value[0].id;
            console.log('DailyReports list ID:', listId);
            
            // Build the list item with fields that exist
            const listItem = {
                fields: {
                    Title: `Daily Report - ${reportData.jobNumber} - ${reportData.reportDate}`
                }
            };
            
            // Add other fields if they exist in the SharePoint list
            const columnNames = columns.map(col => col.name);
            console.log('📋 Available columns:', columnNames);
            
            // Try to map common field names
            const fieldMappings = [
                { data: reportData.jobNumber, possible: ['JobNumber', 'Job_x0020_Number', 'ProjectNumber', 'Project_x0020_Number'] },
                { data: reportData.superintendent, possible: ['Superintendent', 'SuperintendentName', 'Superintendent_x0020_Name'] },
                { data: reportData.reportDate, possible: ['ReportDate', 'Report_x0020_Date', 'Date', 'DateCreated'] },
                { data: JSON.stringify(reportData.siteVisitors || []), possible: ['SiteVisitors', 'Site_x0020_Visitors', 'Visitors'] },
                { data: JSON.stringify(reportData.subcontractors || []), possible: ['Subcontractors', 'SubContractors', 'Subs'] },
                { data: JSON.stringify(reportData.deliveries || []), possible: ['Deliveries', 'MaterialDeliveries', 'Material_x0020_Deliveries'] },
                { data: reportData.utilitiesOrdered || '', possible: ['UtilitiesOrdered', 'Utilities_x0020_Ordered', 'UtilOrdered'] },
                { data: reportData.utilitiesRemoved || '', possible: ['UtilitiesRemoved', 'Utilities_x0020_Removed', 'UtilRemoved'] },
                { data: reportData.superintendentNotes || '', possible: ['Notes', 'SuperintendentNotes', 'Superintendent_x0020_Notes', 'Comments'] },
                { data: reportData.weatherData || '', possible: ['WeatherData', 'Weather_x0020_Data', 'Weather'] }
            ];
            
            // Map fields that exist
            fieldMappings.forEach(mapping => {
                if (mapping.data) {
                    const foundColumn = mapping.possible.find(possibleName => 
                        columnNames.some(colName => colName.toLowerCase() === possibleName.toLowerCase())
                    );
                    if (foundColumn) {
                        const actualColumnName = columnNames.find(colName => 
                            colName.toLowerCase() === foundColumn.toLowerCase()
                        );
                        listItem.fields[actualColumnName] = mapping.data;
                        console.log(`✅ Mapped field: ${actualColumnName} = ${mapping.data}`);
                    }
                }
            });
            
            console.log('📝 Final list item to save:', listItem);
            
            // Create the item in SharePoint
            const response = await this.makeRequest(`/sites/${siteId}/lists/${listId}/items`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(listItem)
            });
            
            console.log('Daily report saved successfully:', response);
            return response;
            
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

    // Get tenant information to find correct SharePoint hostname
    async getTenantInfo() {
        try {
            const token = await getAccessToken();
            
            // Get organization info which includes the SharePoint hostname
            const response = await fetch(`${this.baseUrl}/organization`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const org = await response.json();
            console.log('Organization info:', org);
            
            // Try to get SharePoint root site to find the correct hostname
            const sitesResponse = await fetch(`${this.baseUrl}/sites/root`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (sitesResponse.ok) {
                const rootSite = await sitesResponse.json();
                console.log('Root SharePoint site:', rootSite);
                
                if (rootSite.webUrl) {
                    const url = new URL(rootSite.webUrl);
                    console.log('Correct SharePoint hostname:', url.hostname);
                    return url.hostname;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error getting tenant info:', error);
            return null;
        }
    }

    // Get weather data for a zip code
    async getWeatherData(zipCode) {
        try {
            if (!zipCode) {
                console.log('No zip code provided for weather data');
                return null;
            }
            
            console.log(`🌤️ Getting weather data for zip code: ${zipCode}`);
            const weatherData = weatherService.getWeatherForZipCode(zipCode);
            console.log('🌤️ Weather data retrieved:', weatherData);
            return weatherData;
        } catch (error) {
            console.error('Error getting weather data:', error);
            return null;
        }
    }
}

// Export singleton instance
export const sharePointAPI = new SharePointAPI();
// Expose globally for browser console testing
window.sharePointAPI = sharePointAPI;
