// Daily Report App - Main Application Logic
// This recreates the exact UI layout from your SPFx web part

import { initializeAuth, signIn, getCurrentUser, isSignedIn } from './msal-config.js';
import { sharePointAPI } from './sharepoint-api.js';

class DailyReportApp {
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
    }

    async initialize() {
        try {
            // For now, use demo mode while we configure authentication
            this.currentUser = {
                displayName: "Demo User",
                firstName: "Demo",
                lastName: "User",
                email: "demo@whayland.com"
            };
            
            await this.loadApp();
            
            // TODO: Uncomment this when Azure AD is configured
            // await initializeAuth();
            // if (isSignedIn()) {
            //     this.currentUser = getCurrentUser();
            //     await this.loadApp();
            // } else {
            //     await this.showLogin();
            // }
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to initialize application');
        }
    }

    async showLogin() {
        try {
            await signIn();
            this.currentUser = getCurrentUser();
            await this.loadApp();
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Login failed');
        }
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

    async loadProjects() {
        try {
            // For demo purposes, use sample projects data
            // TODO: Replace with real SharePoint data when configured
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
            
            // TODO: Uncomment when SharePoint is configured
            // this.projects = await sharePointAPI.getProjects();
        } catch (error) {
            console.error('Error loading projects:', error);
            this.projects = [];
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
                    <div class="photo-gallery" onclick="document.getElementById('packingSlipUpload').click()">
                        <div class="photo-gallery-icon">📤</div>
                        <p>Drop packing slip or click to upload</p>
                    </div>
                    <input type="file" id="packingSlipUpload" style="display: none;" accept=".pdf,.jpg,.jpeg,.png">
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
                <div class="photo-gallery" onclick="document.getElementById('photoUpload').click()">
                    <div class="photo-gallery-icon">📷</div>
                    <p>Drag & drop photos here</p>
                    <p style="font-size: 14px;">or click to select files</p>
                    <button type="button" class="btn btn-primary">Select Photos</button>
                </div>
                <input type="file" id="photoUpload" style="display: none;" accept="image/*" multiple>
                <div id="photoPreview"></div>
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
    }

    setupEventListeners() {
        // Project selection handler
        document.getElementById('projectSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                const projectData = JSON.parse(e.target.options[e.target.selectedIndex].dataset.project);
                this.selectedProject = projectData;
                document.getElementById('jobNumber').value = projectData.jobNumber;
            } else {
                this.selectedProject = null;
                document.getElementById('jobNumber').value = '';
            }
        });

        // Photo upload handler
        document.getElementById('photoUpload').addEventListener('change', (e) => {
            this.handlePhotoUpload(e.target.files);
        });

        // Packing slip upload handler
        document.getElementById('packingSlipUpload').addEventListener('change', (e) => {
            this.handlePackingSlipUpload(e.target.files[0]);
        });
    }

    addSiteVisitor() {
        const name = document.getElementById('visitorName').value;
        const company = document.getElementById('visitorCompany').value;
        const purpose = document.getElementById('purposeOfVisit').value;

        if (name && company && purpose) {
            this.reportData.siteVisitors.push({ name, company, purpose });
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
            this.reportData.subcontractors.push({ company, trade, workers, hours, description });
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
            this.reportData.deliveries.push({ supplier, material });
            this.updateDeliveriesList();
            
            // Clear form
            document.getElementById('supplier').value = '';
            document.getElementById('materialDelivered').value = '';
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
        // Handle photo uploads here
        console.log('Photos uploaded:', files);
    }

    handlePackingSlipUpload(file) {
        // Handle packing slip upload here
        console.log('Packing slip uploaded:', file);
    }

    async submitReport() {
        try {
            // Collect all form data
            const reportData = {
                projectId: this.selectedProject?.id,
                jobNumber: document.getElementById('jobNumber').value,
                superintendent: document.getElementById('superintendent').value,
                reportDate: document.getElementById('reportDate').value,
                siteVisitors: this.reportData.siteVisitors,
                subcontractors: this.reportData.subcontractors,
                deliveries: this.reportData.deliveries,
                utilitiesOrdered: document.getElementById('utilitiesOrdered').value,
                utilitiesRemoved: document.getElementById('utilitiesRemoved').value,
                superintendentNotes: document.getElementById('superintendentNotes').value
            };

            // Demo mode - just log the data
            console.log('Demo: Report data that would be saved to SharePoint:', reportData);
            
            // TODO: Uncomment when SharePoint is configured
            // await sharePointAPI.saveDailyReport(reportData);
            
            // Update last saved time
            document.getElementById('lastSaved').textContent = `Last saved: ${new Date().toLocaleTimeString()}`;
            
            alert('Report submitted successfully! (Demo Mode - Check console for data)');
        } catch (error) {
            console.error('Error submitting report:', error);
            alert('Error submitting report. Please try again.');
        }
    }

    resetForm() {
        if (confirm('Are you sure you want to reset the form? All data will be lost.')) {
            location.reload();
        }
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
}

// Initialize the app
const dailyReport = new DailyReportApp();

// Make it globally accessible for button clicks
window.dailyReport = dailyReport;

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    dailyReport.initialize();
});
