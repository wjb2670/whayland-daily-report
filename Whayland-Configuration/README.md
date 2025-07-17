# Whayland Daily Report App Configuration

This folder contains Whayland-specific configuration files and assets for the Daily Report app.

## 📁 Contents

### Configuration Files
- `msal-config-whayland.js` - Azure AD app registration details for Whayland
- `sharepoint-config-whayland.js` - SharePoint site URLs and list configurations
- `app-config-whayland.js` - Company-specific settings and preferences

### Assets
- `whayland-logo.png` - Company logo for app branding
- `whayland-colors.css` - Company color scheme definitions
- `app-icons/` - Whayland-branded app icons for iOS

### Deployment
- `whayland-deployment-guide.md` - Internal deployment instructions
- `azure-ad-setup.md` - Azure AD configuration steps
- `sharepoint-setup.md` - SharePoint list setup and permissions

## 🔧 Usage

Copy these files to the main app when deploying for Whayland:

1. **Configuration**: Replace generic config files with Whayland versions
2. **Branding**: Copy logo and color assets to `/src/assets/`
3. **Styling**: Apply Whayland color scheme to CSS files

## 🚀 Quick Deploy for Whayland

```bash
# Copy configuration files
copy msal-config-whayland.js ../DailyReportApp/src/js/msal-config.js
copy sharepoint-config-whayland.js ../DailyReportApp/src/js/sharepoint-api.js

# Copy branding assets  
copy whayland-logo.png ../DailyReportApp/src/assets/logo.png
copy app-icons/* ../DailyReportApp/src/assets/icon/

# Apply color scheme
# (Manual update of CSS color values from #007bff to #262666)
```

## 📋 Internal Notes

- Azure AD App ID: [TO BE CONFIGURED]
- SharePoint Site: [TO BE CONFIGURED] 
- Tenant ID: [TO BE CONFIGURED]
- Bundle ID: com.whayland.dailyreport
