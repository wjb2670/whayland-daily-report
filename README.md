# Daily Report App - Project Structure

This project contains a mobile Daily Report app with two distinct deployment paths:

## 📁 Folder Structure

### `DailyReportApp/` - Development Environment
- Contains the current working development version
- Used for testing and development
- All source code and development dependencies

### `AppStore-Distribution/` - Generic App Store Version
- Clean, generic version ready for App Store submission
- Removes all Whayland-specific branding and configuration
- Contains generic placeholders that can be customized by any company
- Includes setup documentation for new users

### `Whayland-Configuration/` - Company-Specific Setup
- Contains Whayland's specific configuration files
- SharePoint site URLs, Azure AD app registration details
- Company branding assets (logos, colors)
- Internal deployment instructions

## 🚀 Deployment Strategy

### For App Store Distribution:
1. Use files from `AppStore-Distribution/`
2. Generic branding allows any construction company to use
3. Users configure their own SharePoint/M365 integration

### For Internal Whayland Use:
1. Use configuration from `Whayland-Configuration/`
2. Pre-configured with your SharePoint lists and authentication
3. Ready for immediate team deployment

## 🔄 Workflow
- Develop in `DailyReportApp/`
- Generate App Store version in `AppStore-Distribution/`
- Maintain Whayland configs in `Whayland-Configuration/`
