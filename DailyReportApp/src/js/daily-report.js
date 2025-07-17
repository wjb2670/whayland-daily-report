// Daily Report App - Main Application Logic
// This recreates the exact UI layout from your SPFx web part

import { initializeAuth, signIn, getCurrentUser, isSignedIn } from './msal-config.js';
import { sharePointAPI } from './sharepoint-api.js';
import weatherService from './weather-service.js';

class DailyReportApp {
    // Show report generation UI
    showReportGenerator() {
        const app = document.getElementById('dailyReportApp');
        app.innerHTML = `
            <div class="report-generator">
                <h2>Generate PDF Report</h2>
                <div class="form-group">
                    <label for="reportProjectSelect">Project</label>
                    <select id="reportProjectSelect">
                        <option value="">All Projects</option>
                        ${this.projects.map(p => `<option value="${p.id}">${p.projectName || p.jobNumber}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="reportSuperintendent">Superintendent</label>
                    <input type="text" id="reportSuperintendent" placeholder="All or enter name">
                </div>
                <div class="form-group">
                    <label for="reportStartDate">Start Date</label>
                    <input type="date" id="reportStartDate">
                </div>
                <div class="form-group">
                    <label for="reportEndDate">End Date</label>
                    <input type="date" id="reportEndDate">
                </div>
                <button class="btn btn-primary" onclick="dailyReport.generatePDFReport()">Generate PDF</button>
                <button class="btn btn-secondary" onclick="location.reload()">Back to App</button>
                <div id="pdfReportStatus" style="margin-top:20px;"></div>
            </div>
        `;
    }

    // Generate PDF report (full implementation)
    async generatePDFReport() {
        const projectId = document.getElementById('reportProjectSelect').value;
        const superintendent = document.getElementById('reportSuperintendent').value.trim();
        const startDate = document.getElementById('reportStartDate').value;
        const endDate = document.getElementById('reportEndDate').value;
        const statusDiv = document.getElementById('pdfReportStatus');
        statusDiv.textContent = 'Generating PDF...';

        // Validate date range
        if (startDate && endDate && startDate > endDate) {
            statusDiv.textContent = 'Start date cannot be after end date.';
            return;
        }

        try {
            // Dynamically load jsPDF if not present
            if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
                statusDiv.textContent = 'Loading PDF library...';
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }
            const jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
            if (!jsPDF) throw new Error('jsPDF failed to load.');

            statusDiv.textContent = 'Fetching report data...';
            // Fetch filtered reports from SharePoint
            const filters = {
                projectId: projectId || null,
                superintendent: superintendent || null,
                startDate: startDate || null,
                endDate: endDate || null
            };
            const reports = await sharePointAPI.getFilteredDailyReports(filters);
            if (!reports || reports.length === 0) {
                statusDiv.textContent = 'No reports found for the selected criteria.';
                return;
            }

            statusDiv.textContent = 'Formatting PDF...';
            // Create PDF
            const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'letter' });
            let y = 40;
            doc.setFontSize(18);
            doc.text('Whayland Daily Report', 40, y);
            y += 30;
            doc.setFontSize(12);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 40, y);
            y += 20;
            if (projectId) {
                const project = this.projects.find(p => p.id == projectId);
                doc.text(`Project: ${project ? (project.projectName || project.jobNumber) : projectId}`, 40, y);
                y += 18;
            }
            if (superintendent) {
                doc.text(`Superintendent: ${superintendent}`, 40, y);
                y += 18;
            }
            if (startDate || endDate) {
                doc.text(`Date Range: ${startDate || '...'} to ${endDate || '...'}`, 40, y);
                y += 18;
            }
            y += 10;

            // For each report, add a section
            reports.forEach((report, idx) => {
                if (y > 700) { doc.addPage(); y = 40; }
                doc.setFontSize(14);
                doc.text(`Report Date: ${report.reportDate || 'N/A'}`, 40, y);
                y += 18;
                doc.setFontSize(11);
                doc.text(`Superintendent: ${report.superintendent || ''}`, 40, y);
                y += 14;
                doc.text(`Job Number: ${report.jobNumber || ''}`, 40, y);
                y += 14;
                if (report.weatherData) {
                    doc.text(`Weather: ${report.weatherData}`, 40, y);
                    y += 14;
                }
                // Site Visitors
                if (report.siteVisitors && report.siteVisitors.length > 0) {
                    doc.setFont(undefined, 'bold');
                    doc.text('Site Visitors:', 40, y); y += 14;
                    doc.setFont(undefined, 'normal');
                    report.siteVisitors.forEach(v => {
                        doc.text(`- ${v.name} (${v.company}): ${v.purpose} [${v.timestamp ? new Date(v.timestamp).toLocaleString() : ''}]`, 50, y);
                        y += 12;
                    });
                }
                // Subcontractors
                if (report.subcontractors && report.subcontractors.length > 0) {
                    doc.setFont(undefined, 'bold');
                    doc.text('Subcontractors:', 40, y); y += 14;
                    doc.setFont(undefined, 'normal');
                    report.subcontractors.forEach(s => {
                        doc.text(`- ${s.company} (${s.trade}), Workers: ${s.workers}, Hours: ${s.hours}, Desc: ${s.description} [${s.timestamp ? new Date(s.timestamp).toLocaleString() : ''}]`, 50, y);
                        y += 12;
                    });
                }
                // Deliveries
                if (report.deliveries && report.deliveries.length > 0) {
                    doc.setFont(undefined, 'bold');
                    doc.text('Deliveries:', 40, y); y += 14;
                    doc.setFont(undefined, 'normal');
                    report.deliveries.forEach(d => {
                        doc.text(`- ${d.supplier}: ${d.material} [${d.timestamp ? new Date(d.timestamp).toLocaleString() : ''}]`, 50, y);
                        y += 12;
                        if (d.packingSlips && d.packingSlips.length > 0) {
                            doc.text(`  Packing Slips: ${d.packingSlips.map(ps => ps.name).join(', ')}`, 60, y);
                            y += 12;
                        }
                    });
                }
                // Photos
                if (report.photos && report.photos.length > 0) {
                    doc.setFont(undefined, 'bold');
                    doc.text('Photos:', 40, y); y += 14;
                    doc.setFont(undefined, 'normal');
                    report.photos.forEach(p => {
                        doc.text(`- ${p.name}: ${p.caption} [${p.timestamp ? new Date(p.timestamp).toLocaleString() : ''}]`, 50, y);
                        y += 12;
                    });
                }
                // Utilities
                if (report.utilitiesOrdered || report.utilitiesRemoved) {
                    doc.setFont(undefined, 'bold');
                    doc.text('Utilities:', 40, y); y += 14;
                    doc.setFont(undefined, 'normal');
                    if (report.utilitiesOrdered) {
                        doc.text(`Ordered/Installed: ${report.utilitiesOrdered}`, 50, y); y += 12;
                    }
                    if (report.utilitiesRemoved) {
                        doc.text(`Removed: ${report.utilitiesRemoved}`, 50, y); y += 12;
                    }
                }
                // Superintendent Notes
                if (report.superintendentNotes) {
                    doc.setFont(undefined, 'bold');
                    doc.text('Superintendent Notes:', 40, y); y += 14;
                    doc.setFont(undefined, 'normal');
                    doc.text(report.superintendentNotes, 50, y, { maxWidth: 500 });
                    y += 20;
                }
                y += 10;
                doc.setDrawColor(200);
                doc.line(40, y, 570, y);
                y += 10;
            });

            // Download the PDF
            const fileName = `Whayland_DailyReport_${startDate || ''}_${endDate || ''}.pdf`;
            doc.save(fileName);
            statusDiv.textContent = `PDF generated successfully (${reports.length} report${reports.length > 1 ? 's' : ''}).`;
        } catch (err) {
            console.error('PDF generation error:', err);
            statusDiv.textContent = 'Error generating PDF: ' + err.message;
        }
    }
    constructor() {
        this.currentUser = null;
        this.projects = [];
        this.selectedProject = null;
        this.reportData = {
            siteVisitors: [],
            subcontractors: [],
            deliveries: [],
            photos: []
        };
        this.currentWeatherData = null;
        this.currentPackingSlips = []; // Track packing slips for current delivery
        this.currentPhotos = []; // Track photos with captions for current session
    }

    async initialize() {
        try {
            // Try to initialize Whayland authentication
            console.log('Initializing Whayland authentication...');
            await initializeAuth();
            
            // Start weather system for 7 AM and 2 PM updates
            // Note: Will be updated with project list after loading
            weatherService.startWeatherSystem();
            console.log('🌤️ Weather system started for 7:00 AM and 2:00 PM updates');
            
            if (isSignedIn()) {
                console.log('User already signed in');
                this.currentUser = getCurrentUser();
                await this.loadApp();
            } else {
                console.log('User not signed in, showing login screen');
                await this.showLogin();
            }
        } catch (error) {
            console.error('Authentication initialization failed:', error);
            
            // Fallback to demo mode if authentication fails
            console.log('Falling back to demo mode...');
            this.currentUser = {
                displayName: "Demo User (Auth Failed)",
                firstName: "Demo",
                lastName: "User",
                email: "demo@whayland.com"
            };
            
            // Show error message but continue with demo
            this.showAuthError(error.message);
            await this.loadApp();
        }
    }

    async showLogin() {
        // Hide loading spinner
        document.getElementById('loadingSpinner').style.display = 'none';
        
        // Show login screen
        const appContainer = document.getElementById('dailyReportApp');
        appContainer.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="whayland-logo">
                        <img src="./assets/logo.png" alt="Whayland Company" class="logo-img">
                        <div class="welcome-message">
                            Welcome to Whayland Daily Report
                        </div>
                    </div>
                    <p>Sign in with your Whayland Microsoft 365 account to continue.</p>
                    <button id="signInButton" class="btn btn-primary">
                        <span>🔐</span> Sign in with Microsoft
                    </button>
                </div>
            </div>
        `;

        // Add login-specific styles
        const style = document.createElement('style');
        style.textContent = `
            .login-container {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                padding: 20px;
            }
            .login-card {
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                text-align: center;
                max-width: 400px;
                width: 100%;
            }
            .login-card p {
                color: #666;
                margin: 20px 0 30px 0;
                line-height: 1.5;
            }
            #signInButton {
                font-size: 16px;
                padding: 12px 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                margin: 0 auto;
            }
        `;
        document.head.appendChild(style);

        // Set up sign-in button event
        document.getElementById('signInButton').addEventListener('click', async () => {
            try {
                document.getElementById('signInButton').textContent = 'Signing in...';
                await signIn();
                this.currentUser = getCurrentUser();
                await this.loadApp();
            } catch (error) {
                console.error('Login error:', error);
                this.showError('Login failed: ' + error.message);
            }
        });
    }

    async loadApp() {
        // Hide loading spinner
        document.getElementById('loadingSpinner').style.display = 'none';
        
        // Load projects from SharePoint
        await this.loadProjects();
        
        // Render the Daily Report UI
        this.renderUI();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    // Test SharePoint connection - for debugging
    async testSharePointConnection() {
        console.log('=== TESTING SHAREPOINT CONNECTION ===');
        
        try {
            // Test 1: Check authentication
            console.log('Test 1: Checking authentication...');
            const user = getCurrentUser();
            console.log('Current user:', user);
            
            if (!user) {
                throw new Error('User not authenticated');
            }
            
            // Test 2: Get access token
            console.log('Test 2: Getting access token...');
            const token = await sharePointAPI.getAccessToken();
            console.log('Access token obtained:', token ? 'YES' : 'NO');
            
            // Test 2.5: Try to discover correct SharePoint hostname
            console.log('Test 2.5: Trying to discover correct SharePoint hostname...');
            
            let correctHostname = null;
            
            // Try root site discovery first
            try {
                console.log('Attempting to get root SharePoint site...');
                const response = await fetch(`https://graph.microsoft.com/v1.0/sites/root`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                
                console.log('Root site response status:', response.status);
                
                if (response.ok) {
                    const rootSite = await response.json();
                    console.log('Root SharePoint site found:', rootSite);
                    
                    if (rootSite.webUrl) {
                        const url = new URL(rootSite.webUrl);
                        correctHostname = url.hostname;
                        console.log('*** DISCOVERED CORRECT SHAREPOINT HOSTNAME FROM ROOT SITE:', correctHostname);
                        console.log('*** FULL ROOT SITE URL:', rootSite.webUrl);
                    }
                } else {
                    const errorText = await response.text();
                    console.log('Root site request failed:', errorText);
                }
            } catch (rootError) {
                console.log('Root site discovery failed:', rootError.message);
            }
            
            // Also try to get all sites the user has access to
            try {
                console.log('Getting all sites user has access to...');
                const sitesResponse = await fetch(`https://graph.microsoft.com/v1.0/sites?search=*`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                
                if (sitesResponse.ok) {
                    const sites = await sitesResponse.json();
                    console.log('All accessible sites:', sites.value);
                    
                    // Look for a site that might contain 'DailyReports'
                    const dailyReportsSite = sites.value.find(site => 
                        site.webUrl && site.webUrl.includes('DailyReports')
                    );
                    
                    if (dailyReportsSite) {
                        console.log('*** FOUND DAILY REPORTS SITE:', dailyReportsSite.webUrl);
                        const url = new URL(dailyReportsSite.webUrl);
                        correctHostname = url.hostname;
                    }
                    
                    // If not found, just use the first site's hostname
                    if (!correctHostname && sites.value.length > 0) {
                        const firstSite = sites.value[0];
                        const url = new URL(firstSite.webUrl);
                        correctHostname = url.hostname;
                        console.log('*** USING HOSTNAME FROM FIRST ACCESSIBLE SITE:', correctHostname);
                    }
                }
            } catch (sitesError) {
                console.log('Sites search failed:', sitesError.message);
            }
            
            // If root discovery failed, try common hostname variations
            if (!correctHostname) {
                for (const hostname of possibleHostnames) {
                    try {
                        console.log(`Trying hostname: ${hostname}`);
                        const testUrl = `https://graph.microsoft.com/v1.0/sites/${hostname}:/sites/DailyReports`;
                        const response = await fetch(testUrl, {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Accept': 'application/json'
                            }
                        });
                        
                        if (response.ok) {
                            correctHostname = hostname;
                            console.log('*** FOUND WORKING HOSTNAME:', correctHostname);
                            break;
                        } else {
                            console.log(`${hostname} failed:`, response.status);
                        }
                    } catch (error) {
                        console.log(`${hostname} error:`, error.message);
                    }
                }
            }
            
            if (correctHostname) {
                console.log('*** SOLUTION: Update SHAREPOINT_SITE_URL in sharepoint-api.js to:');
                console.log(`*** https://${correctHostname}/sites/DailyReports`);
            } else {
                console.log('*** Could not find correct hostname. Please check your SharePoint URL manually.');
            }
            
            console.log('=== SHAREPOINT CONNECTION TEST COMPLETE ===');
            return true;
            
        } catch (error) {
            console.error('SharePoint connection test failed:', error);
            return false;
        }
    }

    async loadProjects() {
        try {
            console.log('Loading projects from SharePoint...');
            
            // Try to load from SharePoint first
            this.projects = await sharePointAPI.getProjects();
            
            if (this.projects && this.projects.length > 0) {
                console.log('Successfully loaded projects from SharePoint:', this.projects);
                
                // Update weather service with project list for auto-generation
                weatherService.startWeatherSystem(this.projects, sharePointAPI);
                console.log('🤖 Weather service updated with project list for automatic daily reports');
                
                return;
            } else {
                console.warn('SharePoint returned empty results, checking if list exists...');
                throw new Error('No projects found in SharePoint list');
            }
            
        } catch (error) {
            console.error('Error loading projects from SharePoint:', error);
            console.log('Falling back to demo projects data');
            
            // Show error to user
            if (document.querySelector('.error-message')) {
                document.querySelector('.error-message').remove();
            }
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.cssText = 'background: #ffebee; color: #c62828; padding: 10px; margin: 10px; border-radius: 4px; border-left: 4px solid #c62828;';
            errorDiv.innerHTML = `<strong>SharePoint Connection Error:</strong> ${error.message}<br><small>Using demo data. Check console for details.</small>`;
            document.body.insertBefore(errorDiv, document.body.firstChild);
            
            // Fallback to demo data if SharePoint fails
            this.projects = [
                {
                    id: 1,
                    jobNumber: "2025-001",
                    projectName: "Main Street Office Building",
                    streetAddress: "123 Main Street",
                    city: "Anytown",
                    state: "NY",
                    zipCode: "12345",
                    projectManager: "John Smith",
                    superintendent: "Demo User",
                    owner: "ABC Corporation"
                },
                {
                    id: 2,
                    jobNumber: "2025-002", 
                    projectName: "Riverside Apartments",
                    streetAddress: "456 River Road",
                    city: "Riverside",
                    state: "NY", 
                    zipCode: "12346",
                    projectManager: "Jane Doe",
                    superintendent: "Demo User",
                    owner: "XYZ Development"
                }
            ];
        }
    }

    renderUI() {
        const app = document.getElementById('dailyReportApp');
        app.innerHTML = `
            <!-- Header Section -->
            <div class="header-section">
                <div class="whayland-logo">
                    <img src="./assets/logo.png" alt="Whayland" class="logo-img">
                    <div class="welcome-message">Welcome, ${this.currentUser.firstName}!</div>
                </div>
            </div>

            <!-- Daily Report Header -->
            <div class="daily-report-header">
                <h2>Daily Report Header</h2>
                
                <div class="form-group">
                    <label for="projectSelect">Select Project *</label>
                    <select id="projectSelect" required>
                        <option value="">Select a project</option>
                        ${this.projects.map(project => 
                            `<option value="${project.jobNumber}" data-project='${JSON.stringify(project)}'>${project.projectName || project.jobNumber}</option>`
                        ).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label for="jobNumber">Job Number</label>
                    <input type="text" id="jobNumber" readonly placeholder="Auto-populated from selected project">
                </div>

                <div class="form-group">
                    <label for="superintendent">Superintendent *</label>
                    <input type="text" id="superintendent" value="${this.currentUser.displayName}" readonly>
                </div>

                <div class="form-group">
                    <label for="reportDate">Report Date</label>
                    <input type="date" id="reportDate" value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>

            <!-- Weather Conditions -->
            <div class="section-card">
                <h3>Weather Conditions</h3>
                <p>Select a project to view weather conditions.</p>
            </div>

            <!-- Site Visitors -->
            <div class="section-card">
                <h3>Site Visitors</h3>
                <div class="form-group">
                    <input type="text" id="visitorName" placeholder="Visitor Name">
                </div>
                <div class="form-group">
                    <input type="text" id="visitorCompany" placeholder="Company">
                </div>
                <div class="form-group">
                    <input type="text" id="purposeOfVisit" placeholder="Purpose of Visit">
                    <button type="button" class="btn btn-add" onclick="dailyReport.addSiteVisitor()">Add</button>
                </div>
                <div id="siteVisitorsList"></div>
            </div>

            <!-- Subcontractors -->
            <div class="section-card">
                <h3>Subcontractors</h3>
                <div class="form-group">
                    <input type="text" id="subcontractorCompany" placeholder="Subcontractor Company">
                </div>
                <div class="form-group">
                    <input type="text" id="trade" placeholder="Trade">
                </div>
                <div class="form-group">
                    <input type="number" id="numberOfWorkers" placeholder="# of Workers">
                </div>
                <div class="form-group">
                    <input type="text" id="hours" placeholder="Hours">
                </div>
                <div class="form-group">
                    <textarea id="descriptionOfWork" placeholder="Description of Work" rows="3"></textarea>
                    <button type="button" class="btn btn-add" onclick="dailyReport.addSubcontractor()">Add</button>
                </div>
                <div id="subcontractorsList"></div>
            </div>

            <!-- Deliveries -->
            <div class="section-card">
                <h3>Deliveries</h3>
                <div class="form-group">
                    <input type="text" id="supplier" placeholder="Supplier">
                </div>
                <div class="form-group">
                    <input type="text" id="materialDelivered" placeholder="Material Delivered">
                </div>
                <div class="form-group">
                    <div class="packing-slip-upload-area">
                        <div class="photo-gallery" onclick="document.getElementById('packingSlipUpload').click()">
                            <div class="photo-gallery-icon">📤</div>
                            <p>Drop packing slip(s) or click to upload</p>
                            <p style="font-size: 12px; color: #666;">Supports PDF, JPG, PNG files</p>
                        </div>
                        <input type="file" id="packingSlipUpload" style="display: none;" accept=".pdf,.jpg,.jpeg,.png" multiple>
                        <div id="packingSlipPreview"></div>
                    </div>
                    <button type="button" class="btn btn-add" onclick="dailyReport.addDelivery()">Add</button>
                </div>
                <div id="deliveriesList"></div>
            </div>

            <!-- Utilities -->
            <div class="section-card">
                <h3>Utilities</h3>
                <div class="form-group">
                    <textarea id="utilitiesOrdered" placeholder="Utilities Ordered / Installed" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <textarea id="utilitiesRemoved" placeholder="Utilities Removed" rows="3"></textarea>
                </div>
            </div>

            <!-- Photo Gallery -->
            <div class="section-card">
                <h3>Photo Gallery</h3>
                <div class="photo-upload-section">
                    <div class="photo-gallery" onclick="document.getElementById('photoUpload').click()">
                        <div class="photo-gallery-icon">📷</div>
                        <p>Take photo or select from device</p>
                        <p style="font-size: 14px;">Click to capture or select photos</p>
                        <button type="button" class="btn btn-primary">Select Photos</button>
                    </div>
                    <input type="file" id="photoUpload" style="display: none;" accept="image/*" multiple capture="environment">
                    
                    <div id="photoPreviewSection" style="display: none;">
                        <div id="photoPreview"></div>
                        <div class="photo-caption-section">
                            <textarea id="photoCaption" placeholder="Add caption or description for selected photos..." rows="2"></textarea>
                            <button type="button" class="btn btn-add" onclick="dailyReport.addPhotosWithCaption()">Add Photos</button>
                        </div>
                    </div>
                </div>
                
                <div id="addedPhotosList"></div>
            </div>

            <!-- Superintendent Notes -->
            <div class="section-card">
                <h3>Superintendent Notes</h3>
                <div class="form-group">
                    <textarea id="superintendentNotes" placeholder="Additional Notes" rows="6"></textarea>
                </div>
            </div>

            <!-- Last Saved & Form Actions -->
            <div class="form-actions">
                <div class="last-saved" id="lastSaved">Last saved: 9:12:50 AM</div>
                <button type="button" class="btn btn-primary" onclick="dailyReport.submitReport()">Submit Report</button>
                <button type="button" class="btn btn-secondary" onclick="dailyReport.resetForm()">Reset Form</button>
            </div>
        `;
        
        // Add CSS for packing slip upload styling
        if (!document.getElementById('packing-slip-styles')) {
            const style = document.createElement('style');
            style.id = 'packing-slip-styles';
            style.textContent = `
                .packing-slip-upload-area {
                    margin-bottom: 10px;
                }
                .packing-slip-upload-area .photo-gallery {
                    min-height: 80px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    border: 2px dashed #dee2e6;
                    border-radius: 8px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: #f8f9fa;
                }
                .packing-slip-upload-area .photo-gallery:hover {
                    border-color: #007bff;
                    background: #e3f2fd;
                }
                .packing-slip-upload-area .photo-gallery-icon {
                    font-size: 24px;
                    margin-bottom: 8px;
                }
                .packing-slip-upload-area .photo-gallery p {
                    margin: 4px 0;
                    text-align: center;
                }
                #packingSlipPreview {
                    max-height: 200px;
                    overflow-y: auto;
                }
                .photo-upload-section {
                    margin-bottom: 15px;
                }
                .photo-caption-section {
                    margin-top: 10px;
                    padding: 10px;
                    background: #f8f9fa;
                    border-radius: 4px;
                    border: 1px solid #dee2e6;
                }
                .photo-caption-section textarea {
                    width: 100%;
                    margin-bottom: 10px;
                    padding: 8px;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    resize: vertical;
                }
                #photoPreview {
                    max-height: 200px;
                    overflow-y: auto;
                    padding: 10px;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                    background: white;
                    margin-bottom: 10px;
                }
            `;
            document.head.appendChild(style);
        }
    }

    setupEventListeners() {
        // Project selection handler
        document.getElementById('projectSelect').addEventListener('change', async (e) => {
            if (e.target.value) {
                const projectData = JSON.parse(e.target.options[e.target.selectedIndex].dataset.project);
                this.selectedProject = projectData;
                document.getElementById('jobNumber').value = projectData.jobNumber;
                
                // Generate weather data for 7 AM and 2 PM automatically
                await this.generateWeatherData(projectData);
            } else {
                this.selectedProject = null;
                document.getElementById('jobNumber').value = '';
                this.currentWeatherData = null;
            }
        });

        // Photo upload handler
        document.getElementById('photoUpload').addEventListener('change', (e) => {
            this.handlePhotoUpload(e.target.files);
        });

        // Packing slip upload handler
        document.getElementById('packingSlipUpload').addEventListener('change', (e) => {
            this.handlePackingSlipUpload(e.target.files);
        });
    }

    addSiteVisitor() {
        const name = document.getElementById('visitorName').value;
        const company = document.getElementById('visitorCompany').value;
        const purpose = document.getElementById('purposeOfVisit').value;

        if (name && company && purpose) {
            this.reportData.siteVisitors.push({
                name,
                company,
                purpose,
                timestamp: new Date().toISOString()
            });
            this.updateSiteVisitorsList();
            // Clear form
            document.getElementById('visitorName').value = '';
            document.getElementById('visitorCompany').value = '';
            document.getElementById('purposeOfVisit').value = '';
        }
    }

    addSubcontractor() {
        const company = document.getElementById('subcontractorCompany').value;
        const trade = document.getElementById('trade').value;
        const workers = document.getElementById('numberOfWorkers').value;
        const hours = document.getElementById('hours').value;
        const description = document.getElementById('descriptionOfWork').value;

        if (company && trade) {
            this.reportData.subcontractors.push({
                company,
                trade,
                workers,
                hours,
                description,
                timestamp: new Date().toISOString()
            });
            this.updateSubcontractorsList();
            // Clear form
            document.getElementById('subcontractorCompany').value = '';
            document.getElementById('trade').value = '';
            document.getElementById('numberOfWorkers').value = '';
            document.getElementById('hours').value = '';
            document.getElementById('descriptionOfWork').value = '';
        }
    }

    addDelivery() {
        const supplier = document.getElementById('supplier').value;
        const material = document.getElementById('materialDelivered').value;

        if (supplier && material) {
            const delivery = {
                supplier,
                material,
                packingSlips: [...this.currentPackingSlips], // Copy current packing slips
                timestamp: new Date().toISOString()
            };
            this.reportData.deliveries.push(delivery);
            this.updateDeliveriesList();
            // Clear form
            document.getElementById('supplier').value = '';
            document.getElementById('materialDelivered').value = '';
            // Clear packing slips for next delivery
            this.currentPackingSlips = [];
            this.updatePackingSlipPreview();
            // Reset file input
            const fileInput = document.getElementById('packingSlipUpload');
            if (fileInput) {
                fileInput.value = '';
            }
        } else {
            alert('Please enter both supplier and material information.');
        }
    }

    updateSiteVisitorsList() {
        const list = document.getElementById('siteVisitorsList');
        list.innerHTML = this.reportData.siteVisitors.map((visitor, index) => `
            <div style="padding: 10px; background: #f8f9fa; margin: 5px 0; border-radius: 4px;">
                <strong>${visitor.name}</strong> - ${visitor.company}<br>
                <em>${visitor.purpose}</em>
                <button style="float: right;" onclick="dailyReport.removeSiteVisitor(${index})">Remove</button>
            </div>
        `).join('');
    }

    updateSubcontractorsList() {
        const list = document.getElementById('subcontractorsList');
        list.innerHTML = this.reportData.subcontractors.map((sub, index) => `
            <div style="padding: 10px; background: #f8f9fa; margin: 5px 0; border-radius: 4px;">
                <strong>${sub.company}</strong> - ${sub.trade}<br>
                Workers: ${sub.workers}, Hours: ${sub.hours}<br>
                <em>${sub.description}</em>
                <button style="float: right;" onclick="dailyReport.removeSubcontractor(${index})">Remove</button>
            </div>
        `).join('');
    }

    updateDeliveriesList() {
        const list = document.getElementById('deliveriesList');
        list.innerHTML = this.reportData.deliveries.map((delivery, index) => `
            <div style="padding: 10px; background: #f8f9fa; margin: 5px 0; border-radius: 4px;">
                <strong>${delivery.supplier}</strong><br>
                ${delivery.material}
                ${delivery.packingSlips && delivery.packingSlips.length > 0 ? `
                    <div style="margin-top: 8px;">
                        <small style="color: #666;">📎 Packing Slips (${delivery.packingSlips.length}):</small>
                        <div style="margin-top: 4px;">
                            ${delivery.packingSlips.map((slip, slipIndex) => `
                                <span style="display: inline-block; background: #e9ecef; padding: 2px 6px; margin: 2px; border-radius: 3px; font-size: 11px;">
                                    ${slip.name}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                <button style="float: right;" onclick="dailyReport.removeDelivery(${index})">Remove</button>
            </div>
        `).join('');
    }

    removeSiteVisitor(index) {
        this.reportData.siteVisitors.splice(index, 1);
        this.updateSiteVisitorsList();
    }

    removeSubcontractor(index) {
        this.reportData.subcontractors.splice(index, 1);
        this.updateSubcontractorsList();
    }

    removeDelivery(index) {
        this.reportData.deliveries.splice(index, 1);
        this.updateDeliveriesList();
    }

    handlePhotoUpload(files) {
        console.log('Photos uploaded:', files);
        
        if (files && files.length > 0) {
            const preview = document.getElementById('photoPreview');
            const previewSection = document.getElementById('photoPreviewSection');
            
            // Clear previous preview
            preview.innerHTML = '';
            
            // Store files temporarily for caption addition
            this.tempPhotoFiles = Array.from(files);
            
            // Show preview section
            previewSection.style.display = 'block';
            
            // Create preview for each file
            this.tempPhotoFiles.forEach((file, index) => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const photoDiv = document.createElement('div');
                        photoDiv.style.cssText = 'display: inline-block; margin: 5px; position: relative;';
                        photoDiv.innerHTML = `
                            <img src="${e.target.result}" 
                                 style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px; border: 2px solid #dee2e6;">
                            <div style="font-size: 10px; text-align: center; margin-top: 2px;">${file.name}</div>
                        `;
                        preview.appendChild(photoDiv);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    }

    // New method to add photos with captions
    addPhotosWithCaption() {
        const caption = document.getElementById('photoCaption').value.trim();
        
        if (this.tempPhotoFiles && this.tempPhotoFiles.length > 0) {
            // Add photos to the main photos array
            this.tempPhotoFiles.forEach(file => {
                const photo = {
                    file: file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    caption: caption || 'No description provided',
                    timestamp: new Date().toISOString(),
                    id: Date.now() + Math.random() // Simple unique ID
                };
                this.reportData.photos.push(photo);
            });
            // Clear temporary storage
            this.tempPhotoFiles = [];
            // Clear preview and caption
            document.getElementById('photoPreview').innerHTML = '';
            document.getElementById('photoCaption').value = '';
            document.getElementById('photoPreviewSection').style.display = 'none';
            // Reset file input
            const fileInput = document.getElementById('photoUpload');
            if (fileInput) {
                fileInput.value = '';
            }
            // Update the added photos list
            this.updateAddedPhotosList();
        } else {
            alert('Please select photos first.');
        }
    }

    // New method to display added photos
    updateAddedPhotosList() {
        const list = document.getElementById('addedPhotosList');
        
        if (this.reportData.photos.length === 0) {
            list.innerHTML = '';
            return;
        }
        
        list.innerHTML = `
            <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 4px; border: 1px solid #dee2e6;">
                <div style="font-weight: bold; margin-bottom: 10px; color: #495057;">
                    📸 Added Photos (${this.reportData.photos.length})
                </div>
                ${this.reportData.photos.map((photo, index) => `
                    <div style="display: flex; align-items: center; padding: 8px; margin: 5px 0; background: white; border-radius: 4px; border: 1px solid #e9ecef;">
                        <div style="flex: 0 0 60px; margin-right: 10px;">
                            <div style="width: 50px; height: 50px; background: #dee2e6; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                                📷
                            </div>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 12px; font-weight: bold; margin-bottom: 2px;">${photo.name}</div>
                            <div style="font-size: 11px; color: #666; margin-bottom: 4px;">
                                ${(photo.size / 1024).toFixed(1)} KB • ${new Date(photo.timestamp).toLocaleTimeString()}
                            </div>
                            <div style="font-size: 12px; color: #495057; font-style: italic;">
                                "${photo.caption}"
                            </div>
                        </div>
                        <button onclick="dailyReport.removePhoto(${index})" 
                                style="background: #dc3545; color: white; border: none; border-radius: 2px; padding: 4px 8px; font-size: 10px; cursor: pointer;">
                            Remove
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Method to remove a photo
    removePhoto(index) {
        this.reportData.photos.splice(index, 1);
        this.updateAddedPhotosList();
    }

    handlePackingSlipUpload(files) {
        console.log('Packing slips uploaded:', files);
        
        if (files && files.length > 0) {
            // Add new files to current packing slips
            Array.from(files).forEach(file => {
                // Validate file type
                const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
                if (validTypes.includes(file.type)) {
                    const packingSlip = {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        file: file, // Store the actual file object
                        timestamp: new Date().toISOString()
                    };
                    this.currentPackingSlips.push(packingSlip);
                } else {
                    alert(`File "${file.name}" is not supported. Please use PDF, JPG, or PNG files.`);
                }
            });
            
            // Update the preview
            this.updatePackingSlipPreview();
        }
    }

    // New method to update packing slip preview
    updatePackingSlipPreview() {
        const preview = document.getElementById('packingSlipPreview');
        if (!preview) return;
        
        if (this.currentPackingSlips.length === 0) {
            preview.innerHTML = '';
            return;
        }
        
        preview.innerHTML = `
            <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px; border: 1px solid #dee2e6;">
                <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
                    📎 ${this.currentPackingSlips.length} file(s) ready to attach:
                </div>
                ${this.currentPackingSlips.map((slip, index) => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #e9ecef;">
                        <div style="flex: 1;">
                            <span style="font-size: 11px; font-weight: bold;">${slip.name}</span>
                            <span style="font-size: 10px; color: #666; margin-left: 8px;">
                                (${(slip.size / 1024).toFixed(1)} KB)
                            </span>
                        </div>
                        <button onclick="dailyReport.removePackingSlip(${index})" 
                                style="background: #dc3545; color: white; border: none; border-radius: 2px; padding: 2px 6px; font-size: 10px; cursor: pointer;">
                            ×
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Method to remove a packing slip from current upload
    removePackingSlip(index) {
        this.currentPackingSlips.splice(index, 1);
        this.updatePackingSlipPreview();
    }

    // Debug function to find the correct DailyReports list name
    async testFindDailyReportsList() {
        try {
            console.log('🔍 Searching for DailyReports list...');
            
            const siteId = await sharePointAPI.getSiteId();
            console.log('Site ID:', siteId);
            
            // Get all lists
            const listsResponse = await sharePointAPI.makeRequest(`/sites/${siteId}/lists`);
            console.log('All available lists:', listsResponse.value.map(list => ({
                displayName: list.displayName,
                name: list.name,
                id: list.id
            })));
            
            // Look for lists that might be DailyReports
            const possibleNames = ['DailyReports', 'Daily Reports', 'dailyreports', 'Daily_Reports'];
            let foundList = null;
            
            for (const name of possibleNames) {
                const found = listsResponse.value.find(list => 
                    list.displayName.toLowerCase() === name.toLowerCase() ||
                    list.name.toLowerCase() === name.toLowerCase()
                );
                if (found) {
                    foundList = found;
                    console.log(`✅ Found list with name "${name}":`, found);
                    break;
                }
            }
            
            if (!foundList) {
                console.log('❌ No DailyReports list found. Available lists:');
                listsResponse.value.forEach(list => {
                    console.log(`- "${list.displayName}" (internal: "${list.name}")`);
                });
            }
            
            return foundList;
            
        } catch (error) {
            console.error('Error finding DailyReports list:', error);
            return null;
        }
    }

    async submitReport() {
        try {
            // Validate required fields
            if (!this.selectedProject) {
                this.showErrorMessage('Please select a project before submitting the report.');
                return;
            }
            
            if (!document.getElementById('superintendent').value.trim()) {
                this.showErrorMessage('Please enter a superintendent name.');
                return;
            }
            
            if (!document.getElementById('reportDate').value) {
                this.showErrorMessage('Please select a report date.');
                return;
            }
            
            // Show loading state
            const submitBtn = document.querySelector('button[onclick="app.submitReport()"]');
            const originalText = submitBtn?.textContent;
            if (submitBtn) {
                submitBtn.textContent = 'Saving to SharePoint...';
                submitBtn.disabled = true;
            }
            
            // Collect all form data
            const reportData = {
                projectId: this.selectedProject?.id,
                jobNumber: document.getElementById('jobNumber').value,
                superintendent: document.getElementById('superintendent').value,
                reportDate: document.getElementById('reportDate').value,
                siteVisitors: this.reportData.siteVisitors,
                subcontractors: this.reportData.subcontractors,
                deliveries: this.reportData.deliveries,
                photos: this.reportData.photos,
                utilitiesOrdered: document.getElementById('utilitiesOrdered').value,
                utilitiesRemoved: document.getElementById('utilitiesRemoved').value,
                superintendentNotes: document.getElementById('superintendentNotes').value,
                weatherData: this.currentWeatherData ? weatherService.formatWeatherForSharePoint(this.currentWeatherData.combined) : '',
                createdBy: this.currentUser?.displayName || 'Unknown User'
            };

            console.log('Submitting report data to SharePoint:', reportData);
            
            // Log weather data specifically
            if (this.currentWeatherData) {
                console.log('🌤️ Including weather data:', this.currentWeatherData.summary);
                console.log('🌤️ Full weather data:', this.currentWeatherData);
            } else {
                console.log('⚠️ No weather data available - select a project first');
            }
            
            // First, let's find the correct DailyReports list
            console.log('🔍 Step 1: Finding DailyReports list...');
            const dailyReportsList = await this.testFindDailyReportsList();
            
            if (!dailyReportsList) {
                throw new Error('DailyReports list not found. Please check the console to see available lists.');
            }
            
            // Save to SharePoint DailyReports list
            console.log('🚀 Step 2: Starting SharePoint save process...');
            const result = await sharePointAPI.saveDailyReport(reportData);
            console.log('✅ SharePoint save completed successfully:', result);
            
            // Update last saved time
            document.getElementById('lastSaved').textContent = `Last saved: ${new Date().toLocaleTimeString()}`;
            
            // Reset button state
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
            
            // Reset the form after successful submission
            this.resetForm();
            
        } catch (error) {
            console.error('❌ Error submitting report:', error);
            console.error('❌ Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            // Reset button state
            const submitBtn = document.querySelector('button[onclick="app.submitReport()"]');
            if (submitBtn) {
                submitBtn.textContent = 'Submit Report';
                submitBtn.disabled = false;
            }
            
            // Show error message in a more reliable way
            console.error('❌ SAVE FAILED - Check console for details');
            const errorMessage = `Error saving report to SharePoint: ${error.message}`;
            
            // Try to show error in UI if possible
            if (document.querySelector('.error-message')) {
                document.querySelector('.error-message').remove();
            }
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.cssText = 'background: #ffebee; color: #c62828; padding: 15px; margin: 10px; border-radius: 4px; border-left: 4px solid #c62828; position: fixed; top: 20px; right: 20px; max-width: 400px; z-index: 1000;';
            errorDiv.innerHTML = `<strong>Save Failed:</strong><br>${errorMessage}<br><small>Check console for details.</small>`;
            document.body.appendChild(errorDiv);
            
            // Auto-remove error after 10 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 10000);
        }
    }

    // Reset the form after successful submission
    resetForm() {
        console.log('🔄 Resetting form after successful submission...');
        
        // Clear project selection
        const projectSelect = document.getElementById('projectSelect');
        if (projectSelect) {
            projectSelect.value = '';
        }
        
        // Reset selected project
        this.selectedProject = null;
        
        // Clear all text inputs and textareas
        const inputs = document.querySelectorAll('input[type="text"], input[type="number"], textarea');
        inputs.forEach(input => {
            input.value = '';
        });
        
        // Reset superintendent field to current user
        const superintendentField = document.getElementById('superintendent');
        if (superintendentField) {
            superintendentField.value = this.currentUser.displayName;
        }
        
        // Clear date inputs (reset to today)
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            input.value = new Date().toISOString().split('T')[0];
        });
        
        // Reset checkboxes
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Clear all dynamic sections
        this.reportData = {
            siteVisitors: [],
            subcontractors: [],
            deliveries: [],
            photos: []
        };
        
        // Clear current packing slips
        this.currentPackingSlips = [];
        this.updatePackingSlipPreview();
        
        // Clear current packing slips
        this.currentPackingSlips = [];
        this.updatePackingSlipPreview();
        
        // Clear photos and temporary photo data
        this.tempPhotoFiles = [];
        const photoPreview = document.getElementById('photoPreview');
        const photoPreviewSection = document.getElementById('photoPreviewSection');
        const photoCaption = document.getElementById('photoCaption');
        if (photoPreview) photoPreview.innerHTML = '';
        if (photoPreviewSection) photoPreviewSection.style.display = 'none';
        if (photoCaption) photoCaption.value = '';
        this.updateAddedPhotosList();
        
        // Clear site visitors section
        const siteVisitorsList = document.getElementById('siteVisitorsList');
        if (siteVisitorsList) {
            siteVisitorsList.innerHTML = '';
        }
        
        // Clear subcontractors section
        const subcontractorsList = document.getElementById('subcontractorsList');
        if (subcontractorsList) {
            subcontractorsList.innerHTML = '';
        }
        
        // Clear deliveries section
        const deliveriesList = document.getElementById('deliveriesList');
        if (deliveriesList) {
            deliveriesList.innerHTML = '';
        }
        
        // Clear weather data and display
        this.clearWeatherDisplay();
        
        // Reset current user data but keep authentication
        // (don't clear currentUser as we want to stay logged in)
        
        // Scroll back to the top of the page immediately and smoothly
        document.body.scrollTop = 0; // For Safari
        document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
        window.scrollTo(0, 0); // Fallback
        
        // Also try smooth scroll as backup
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
        
        console.log('✅ Form reset completed and scrolled to top');
    }

    showError(message) {
        const app = document.getElementById('dailyReportApp');
        app.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <h2>Error</h2>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn btn-primary">Retry</button>
            </div>
        `;
    }

    showAuthError(errorMessage) {
        // Create a non-blocking notification about auth issues
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #ffeaa7;
            border: 1px solid #fdcb6e;
            color: #2d3436;
            padding: 15px;
            border-radius: 8px;
            max-width: 300px;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;
        notification.innerHTML = `
            <strong>⚠️ Authentication Issue</strong><br>
            <small>${errorMessage}</small><br>
            <small>Running in demo mode. Contact IT to resolve.</small>
            <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 18px; cursor: pointer;">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }

    // Show success message in the UI
    showSuccessMessage(message) {
        const messageElement = document.getElementById('message-display') || this.createMessageElement();
        messageElement.className = 'message success';
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 5000);
    }

    // Show error message in the UI
    showErrorMessage(message) {
        const messageElement = document.getElementById('message-display') || this.createMessageElement();
        messageElement.className = 'message error';
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        
        // Auto-hide after 8 seconds for errors
        setTimeout(() => {
            messageElement.style.display = 'none';
        }, 8000);
    }

    // Create message element if it doesn't exist
    createMessageElement() {
        const messageElement = document.createElement('div');
        messageElement.id = 'message-display';
        messageElement.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            font-weight: bold;
            z-index: 1000;
            max-width: 400px;
            word-wrap: break-word;
            display: none;
        `;
        
        // Add CSS for success and error styles
        const style = document.createElement('style');
        style.textContent = `
            .message.success {
                background-color: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }
            .message.error {
                background-color: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(messageElement);
        
        return messageElement;
    }

    // Generate weather data for 7 AM and 2 PM
    async generateWeatherData(projectData) {
        try {
            if (!projectData.zipCode) {
                console.log('No zip code available for weather data');
                return;
            }

            console.log(`🌤️ Generating 7 AM and 2 PM weather for ${projectData.city}, ${projectData.state} (${projectData.zipCode})`);
            
            // Generate both morning and afternoon weather
            const morningWeather = this.generateWeatherForTime(projectData.zipCode, '07:00');
            const afternoonWeather = this.generateWeatherForTime(projectData.zipCode, '14:00');
            
            // Store both weather readings
            this.currentWeatherData = {
                morning: morningWeather,
                afternoon: afternoonWeather,
                combined: {
                    ...morningWeather,
                    afternoonData: afternoonWeather,
                    summary: `Morning: ${morningWeather.temperature}°F, ${morningWeather.description} | Afternoon: ${afternoonWeather.temperature}°F, ${afternoonWeather.description}`
                }
            };
            
            // Update the existing Weather Conditions field with both readings
            this.updateWeatherConditionsField(morningWeather, afternoonWeather);
            
            console.log(`✅ Weather data generated - Morning: ${morningWeather.summary}, Afternoon: ${afternoonWeather.summary}`);
            
        } catch (error) {
            console.error('Error generating weather data:', error);
        }
    }

    // Generate weather data for a specific time
    generateWeatherForTime(zipCode, time) {
        const seed = zipCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const timeSeed = time === '07:00' ? 1 : 2;
        
        // Different weather patterns for morning vs afternoon
        let tempBase = time === '07:00' ? 55 : 70;
        let tempVariation = time === '07:00' ? 25 : 30;
        
        const temp = tempBase + ((seed * timeSeed) % tempVariation);
        const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain'][(seed * timeSeed) % 4];
        const descriptions = {
            'Clear': 'clear sky',
            'Partly Cloudy': 'few clouds', 
            'Cloudy': 'scattered clouds',
            'Light Rain': 'light rain'
        };

        const now = new Date();
        const scheduledDateTime = new Date(now);
        const [hours, minutes] = time.split(':');
        scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        return {
            temperature: temp,
            description: descriptions[conditions],
            conditions: conditions,
            humidity: 40 + ((seed * timeSeed) % 30),
            windSpeed: 5 + ((seed * timeSeed) % 15),
            city: `${zipCode}`,
            zipCode: zipCode,
            scheduledTime: time,
            timestamp: scheduledDateTime.toISOString(),
            isScheduled: true,
            summary: `${temp}°F, ${descriptions[conditions]} (${time})`
        };
    }

    // Update the existing Weather Conditions container
    updateWeatherConditionsField(morningWeather, afternoonWeather) {
        // Find the existing Weather Conditions container
        const weatherContainers = document.querySelectorAll('.section-card');
        let weatherContainer = null;
        
        for (const container of weatherContainers) {
            const heading = container.querySelector('h3');
            if (heading && heading.textContent.includes('Weather Conditions')) {
                weatherContainer = container;
                break;
            }
        }
        
        if (weatherContainer) {
            // Update the content with both morning and afternoon weather
            weatherContainer.innerHTML = `
                <h3>Weather Conditions</h3>
                <div class="weather-display">
                    <div class="weather-reading">
                        <div class="weather-time">🌅 7:00 AM</div>
                        <div class="weather-info">
                            <strong>${morningWeather.temperature}°F</strong> - ${morningWeather.description}
                        </div>
                        <div class="weather-details">
                            <span>💧 ${morningWeather.humidity}%</span>
                            <span>💨 ${morningWeather.windSpeed} mph</span>
                        </div>
                    </div>
                    <div class="weather-reading">
                        <div class="weather-time">☀️ 2:00 PM</div>
                        <div class="weather-info">
                            <strong>${afternoonWeather.temperature}°F</strong> - ${afternoonWeather.description}
                        </div>
                        <div class="weather-details">
                            <span>💧 ${afternoonWeather.humidity}%</span>
                            <span>💨 ${afternoonWeather.windSpeed} mph</span>
                        </div>
                    </div>
                </div>
            `;
            
            // Add simple styling
            if (!document.getElementById('weather-container-styles')) {
                const style = document.createElement('style');
                style.id = 'weather-container-styles';
                style.textContent = `
                    .weather-display {
                        background: #f8f9fa;
                        padding: 15px;
                        border-radius: 5px;
                        border: 1px solid #dee2e6;
                    }
                    .weather-reading {
                        margin-bottom: 15px;
                        padding-bottom: 15px;
                        border-bottom: 1px solid #e9ecef;
                    }
                    .weather-reading:last-child {
                        margin-bottom: 0;
                        padding-bottom: 0;
                        border-bottom: none;
                    }
                    .weather-time {
                        font-weight: bold;
                        font-size: 1em;
                        color: #495057;
                        margin-bottom: 5px;
                    }
                    .weather-info {
                        font-size: 1.1em;
                        margin-bottom: 8px;
                        color: #495057;
                    }
                    .weather-details {
                        display: flex;
                        gap: 15px;
                        font-size: 0.9em;
                        color: #6c757d;
                    }
                `;
                document.head.appendChild(style);
            }
            
            console.log('✅ Updated Weather Conditions container with both morning and afternoon weather');
        } else {
            console.log('⚠️ Weather Conditions container not found');
        }
    }

    // Clear weather display
    clearWeatherDisplay() {
        const weatherDisplay = document.getElementById('weather-display');
        if (weatherDisplay) {
            weatherDisplay.style.display = 'none';
        }
        this.currentWeatherData = null;
        
        // Reset the Weather Conditions container to default
        const weatherContainers = document.querySelectorAll('.section-card');
        for (const container of weatherContainers) {
            const heading = container.querySelector('h3');
            if (heading && heading.textContent.includes('Weather Conditions')) {
                container.innerHTML = `
                    <h3>Weather Conditions</h3>
                    <p>Select a project to view weather conditions.</p>
                `;
                break;
            }
        }
    }

    // ...existing code...
}

// Initialize the app
const dailyReport = new DailyReportApp();

// Make it globally accessible for button clicks
window.dailyReport = dailyReport;

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    dailyReport.initialize();
});
