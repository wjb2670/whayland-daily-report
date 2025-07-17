# Whayland Daily Report iOS App

A native iOS mobile app for construction daily reporting, built with Capacitor and integrated with SharePoint Online and Microsoft 365.

## Overview

This app wraps the existing SharePoint Framework (SPFx) Daily Report web part in a native iOS container, providing:

- **Native iOS Experience**: App Store distributable with home screen icon
- **Microsoft 365 Authentication**: Seamless SSO with automatic superintendent field population
- **SharePoint Integration**: Full read/write access to Projects list and daily report data
- **Camera & File Upload**: Native iOS camera integration for photo galleries and document uploads
- **Offline Capability**: Local data caching when internet connectivity is limited

## Features

### Core Functionality
- **Project Selection**: Dropdown populated from SharePoint Projects list
- **Auto-filled Superintendent**: Uses M365 logged-in user's display name
- **Site Visitors Tracking**: Add/remove visitor records with company and purpose
- **Subcontractor Management**: Track companies, trades, worker counts, and descriptions
- **Delivery Logging**: Record supplier deliveries with packing slip uploads
- **Utilities Tracking**: Document ordered/installed and removed utilities
- **Photo Gallery**: Multiple photo uploads with native camera integration
- **Superintendent Notes**: Free-form text area for additional observations
- **Data Persistence**: All data saves directly to SharePoint lists

### Technical Features
- **Responsive Design**: Optimized for iPhone and iPad
- **iOS Safe Areas**: Proper handling of notches and home indicators
- **Background Sync**: Automatic data synchronization when connectivity returns
- **Push Notifications**: Optional reporting reminders and status updates

## Prerequisites

### Azure Configuration
1. **Azure AD App Registration**
   - Register a new application in Azure Active Directory
   - Configure redirect URIs for the mobile app
   - Grant SharePoint API permissions

2. **SharePoint Site Setup**
   - Ensure Projects list exists with required columns:
     - Title (Job Number)
     - ProjectName
     - StreetAddress, City, State, ZipCode
     - ProjectManager, Superintendent, Owner

### Development Environment
- Node.js (v20+ recommended)
- Xcode (for iOS development)
- Apple Developer account (for App Store distribution)

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Authentication
Edit `src/js/msal-config.js`:
```javascript
const msalConfig = {
    auth: {
        clientId: "YOUR_AZURE_APP_CLIENT_ID",
        authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
        // ... other settings
    }
};
```

### 3. Configure SharePoint
Edit `src/js/sharepoint-api.js`:
```javascript
const SHAREPOINT_SITE_URL = "https://yourcompany.sharepoint.com/sites/yoursite";
```

### 4. Development Server
```bash
npm start
```

### 5. Build for iOS
```bash
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

## Project Structure

```
src/
├── index.html              # Main app entry point
├── css/
│   ├── style.css          # Base Capacitor styles
│   └── dailyreport.css    # Daily Report specific styles
├── js/
│   ├── msal-config.js     # Microsoft authentication
│   ├── sharepoint-api.js  # SharePoint REST API integration
│   └── daily-report.js    # Main application logic
└── assets/
    └── *.png              # App icons and images
```

## Deployment

### App Store Distribution
1. Build the iOS app in Xcode
2. Configure app signing with your Apple Developer certificate
3. Submit to App Store Connect for review
4. Distribute to employees via App Store

### Enterprise Distribution
1. Configure enterprise provisioning profile
2. Build and sign with enterprise certificate
3. Distribute via Mobile Device Management (MDM)

## Configuration

### SharePoint Lists Required
- **Projects**: Existing list with project information
- **DailyReports**: New list for storing daily report submissions
- **Photos**: Document library for photo storage
- **Documents**: Document library for packing slip storage

### iOS Permissions
The app requests these iOS permissions:
- Camera access (for photo capture)
- Photo library access (for photo selection)
- Location services (optional, for weather integration)

## Troubleshooting

### Authentication Issues
- Verify Azure AD app registration settings
- Check redirect URI configuration
- Ensure SharePoint API permissions are granted

### SharePoint Connection
- Confirm site URL and list names
- Verify user has appropriate SharePoint permissions
- Check network connectivity

### iOS Build Issues
- Ensure Xcode is updated to latest version
- Verify Apple Developer account is active
- Check iOS deployment target compatibility

## Support

For technical support or feature requests, contact the Whayland IT department.
