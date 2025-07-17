# Azure AD App Registration Guide for Whayland Daily Report

## 🎯 Registration Overview
**App Name**: Whayland Daily Report  
**Purpose**: Mobile app for construction daily reporting with SharePoint integration  
**Platform**: iOS (Capacitor hybrid app)

## 📋 Step-by-Step Registration Process

### Step 1: Access Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Sign in with your Whayland Microsoft 365 admin account
3. Navigate to **Azure Active Directory** > **App registrations**
4. Click **"+ New registration"**

### Step 2: Basic App Information
Fill out the registration form:

**Name**: `Whayland Daily Report`  
**Supported account types**: 
- ✅ **"Accounts in this organizational directory only (Whayland only - Single tenant)"**

**Redirect URI**: 
- Platform: **Public client/native (mobile & desktop)**
- URI: `msauth://com.whayland.dailyreport/auth`

Click **"Register"**

### Step 3: Copy Important IDs
After registration, copy these values (we'll need them for configuration):

**Application (client) ID**: `[COPY THIS VALUE]`  
**Directory (tenant) ID**: `[COPY THIS VALUE]`  
**Object ID**: `[COPY THIS VALUE]`

### Step 4: Configure Authentication
1. Go to **Authentication** in the left menu
2. Under **Platform configurations**, verify your redirect URI is correct
3. Under **Advanced settings**:
   - ✅ Check **"Allow public client flows"**
   - Set **"Treat application as a public client"** to **Yes**

### Step 5: API Permissions
1. Go to **API permissions** in the left menu
2. Click **"+ Add a permission"**

**Add Microsoft Graph permissions**:
- Click **Microsoft Graph** > **Delegated permissions**
- Search and add:
  - ✅ **User.Read** (Sign in and read user profile)
  - ✅ **offline_access** (Maintain access to data you have given it access to)

**Add SharePoint permissions**:
- Click **"+ Add a permission"** again
- Click **SharePoint** > **Delegated permissions**  
- Search and add:
  - ✅ **Sites.Read.All** (Read items in all site collections)
  - ✅ **Sites.ReadWrite.All** (Read and write items in all site collections)

3. Click **"Grant admin consent for Whayland"** (admin required)
4. Verify all permissions show **"Granted for Whayland"**

### Step 6: Optional - Branding
1. Go to **Branding & properties**
2. Upload Whayland logo (optional)
3. Set **Privacy statement URL** and **Terms of service URL** (if available)

## 🔧 Configuration Values for App

Once registration is complete, use these values in your app configuration:

```javascript
// src/js/msal-config.js
const msalConfig = {
    auth: {
        clientId: '[YOUR_APPLICATION_CLIENT_ID]',        // From Step 3
        authority: 'https://login.microsoftonline.com/[YOUR_TENANT_ID]', // From Step 3
        redirectUri: 'msauth://com.whayland.dailyreport/auth'
    }
};
```

## ✅ Verification Checklist

Before proceeding, verify:
- [ ] App is registered with correct name
- [ ] Redirect URI is configured for mobile app
- [ ] Public client flows are enabled
- [ ] Microsoft Graph permissions are granted
- [ ] SharePoint permissions are granted
- [ ] Admin consent is provided for all permissions
- [ ] Application ID and Tenant ID are copied

## 🚨 Important Notes

1. **Admin Consent Required**: SharePoint permissions need admin approval
2. **Single Tenant**: App is configured for Whayland users only
3. **Mobile Redirect**: The redirect URI is specifically for iOS app
4. **Security**: Never share the Application ID publicly (though it's not a secret, it identifies your organization)

## 📞 Need Help?

If you encounter issues:
- Ensure you have Azure AD admin privileges
- Contact your IT administrator for permission grants
- Verify your M365 subscription includes Azure AD features

---

**Next Step**: Once registration is complete, we'll configure the app with your specific IDs and test the authentication flow.
