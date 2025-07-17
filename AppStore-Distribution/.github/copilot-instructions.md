<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Whayland Daily Report iOS App - Copilot Instructions

## Project Overview
This is a Capacitor-based iOS mobile app that wraps an existing SharePoint Framework (SPFx) Daily Report web part for Whayland Company. The app provides a native iOS experience while maintaining full SharePoint integration and Microsoft 365 authentication.

## Key Requirements
- **CRITICAL**: Never modify the existing UI layout or design without explicit approval
- Preserve the exact visual appearance of the original SPFx web part
- Auto-populate the Superintendent field with M365 logged-in user data (no dropdown)
- Maintain full SharePoint list integration for data persistence
- Support camera access for photo uploads
- Enable file uploads for packing slips

## Architecture
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Mobile Framework**: Capacitor for native iOS integration
- **Authentication**: Microsoft Authentication Library (MSAL) for M365 login
- **Data Storage**: SharePoint Online lists via REST API
- **Build Tool**: Vite for development and bundling

## SharePoint Integration
- **Projects List**: Contains job numbers, project details, and project assignments
- **Daily Reports List**: Stores completed daily report submissions
- **Document Libraries**: For photo gallery and packing slip storage

## Development Guidelines
1. Use modern JavaScript (ES6+) modules
2. Maintain responsive design for iPhone/iPad compatibility
3. Follow iOS Human Interface Guidelines for native feel
4. Implement proper error handling for offline scenarios
5. Use semantic HTML and accessible design patterns

## Authentication Flow
1. App checks for existing M365 session
2. If not authenticated, shows Microsoft login
3. After successful login, auto-populates Superintendent field
4. Maintains session for seamless SharePoint API access

## File Structure
- `/src/js/msal-config.js` - Microsoft authentication configuration
- `/src/js/sharepoint-api.js` - SharePoint REST API integration
- `/src/js/daily-report.js` - Main application logic and UI
- `/src/css/dailyreport.css` - App-specific styling
- `/src/index.html` - Main application entry point

## Testing Considerations
- Test on both iPhone and iPad form factors
- Verify SharePoint connectivity in different network conditions
- Validate M365 authentication with various user types
- Test photo/file upload functionality

## Deployment Notes
- App Store deployment requires Apple Developer account
- Azure AD app registration needed for M365 authentication
- SharePoint app permissions must be configured properly
