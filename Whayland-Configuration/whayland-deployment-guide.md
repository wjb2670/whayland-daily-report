# Whayland Daily Report App - Internal Deployment Guide

## 🏢 Company Information
- **Company**: Whayland Company
- **App Name**: Whayland Daily Report
- **Bundle ID**: com.whayland.dailyreport
- **Version**: 1.0.0

## 🔐 Authentication Setup

### Azure AD App Registration
1. **App Name**: Whayland Daily Report App
2. **Client ID**: [TO BE CONFIGURED]
3. **Tenant ID**: [TO BE CONFIGURED]
4. **Redirect URI**: `msauth://com.whayland.dailyreport/auth`

### Required API Permissions
- Microsoft Graph:
  - User.Read (to get current user info)
- SharePoint:
  - Sites.Read.All (to read Projects list)
  - Sites.ReadWrite.All (to save daily reports)

## 📊 SharePoint Configuration

### Site Information
- **Site URL**: [TO BE CONFIGURED]
- **Primary List**: Projects
- **Reports List**: Daily Reports (auto-created)

### Projects List Columns
Ensure these columns exist in your SharePoint Projects list:
- Title (Single line of text) - Job Number
- ProjectName (Single line of text)
- StreetAddress (Single line of text)
- City (Single line of text)
- State (Single line of text)
- ZipCode (Single line of text)
- ProjectManager (Single line of text)
- Superintendent (Single line of text)
- Owner (Single line of text)

## 🚀 Deployment Steps

### 1. Configure Environment
```bash
# Navigate to app directory
cd "c:\Users\WendyBlough\OneDrive - Whayland Company\Documents\Final - DailyReportApp\DailyReportApp"

# Copy Whayland configuration files
copy "..\Whayland-Configuration\msal-config-whayland.js" "src\js\msal-config.js"
copy "..\Whayland-Configuration\sharepoint-config-whayland.js" "src\js\sharepoint-api.js"

# Copy Whayland branding
copy "..\Whayland-Configuration\whayland-logo.png" "src\assets\logo.png"
```

### 2. Update Configuration Values
1. Edit `src/js/msal-config.js`:
   - Replace `YOUR_WHAYLAND_CLIENT_ID` with actual Client ID
   - Replace `YOUR_WHAYLAND_TENANT_ID` with actual Tenant ID

2. Edit `src/js/sharepoint-api.js`:
   - Replace SharePoint site URL with actual Whayland site

### 3. Build and Deploy
```bash
# Install dependencies
npm install

# Test in development
npm run dev

# Build for production
npm run build

# Build iOS app
npx cap build ios
```

## 📱 iOS App Store Deployment

### App Information
- **Display Name**: Whayland Daily Report
- **Short Description**: Construction daily reporting for Whayland teams
- **Keywords**: construction, daily report, whayland, project management
- **Category**: Business
- **Age Rating**: 4+ (No objectionable content)

### Required Assets
- App icons (all sizes) - Use Whayland branded icons
- Screenshots (iPhone and iPad)
- App Store description
- Privacy policy URL
- Support URL

### Privacy Information
- Data collection: Project information, daily reports, photos
- Data sharing: Within Whayland organization via SharePoint
- User authentication: Microsoft 365 accounts only

## 🔧 Maintenance

### Regular Updates
- Monitor Azure AD token expiration
- Update SharePoint permissions as needed
- Regular app updates for iOS compatibility

### Support Contacts
- **IT Support**: [Internal IT contact]
- **SharePoint Admin**: [SharePoint administrator]
- **App Developer**: [Development team contact]

## 📋 Testing Checklist

Before deployment, verify:
- [ ] Azure AD authentication works
- [ ] Projects list loads correctly
- [ ] Daily reports save to SharePoint
- [ ] Photo uploads function
- [ ] All form validations work
- [ ] App runs on both iPhone and iPad
- [ ] Offline mode functions properly
- [ ] Company branding displays correctly

## 🚨 Troubleshooting

### Common Issues
1. **Authentication fails**: Check Azure AD app registration and permissions
2. **Projects don't load**: Verify SharePoint site URL and list permissions
3. **Reports don't save**: Check SharePoint write permissions
4. **App crashes**: Review iOS device compatibility

### Log Files
- Browser console for web testing
- Xcode console for iOS testing
- Azure AD logs for authentication issues
