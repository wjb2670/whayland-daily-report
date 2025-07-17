// Whayland Company - Microsoft Authentication Configuration
// This file contains Whayland-specific Azure AD app registration details

import { PublicClientApplication } from '@azure/msal-browser';

// Whayland Azure AD Configuration
const msalConfig = {
  auth: {
    clientId: '6282843f-5ffa-4587-aeaf-ca5adbb0387e', // Whayland's Azure AD App Registration Client ID
    authority: 'https://login.microsoftonline.com/e4d3c722-fd91-46f0-99bd-2d2fe4c58ab6', // Whayland's Tenant ID
    redirectUri: window.location.origin + '/auth-callback',
    postLogoutRedirectUri: window.location.origin
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false
  }
};

// Request scopes for Whayland SharePoint access
const loginRequest = {
  scopes: [
    'User.Read',
    'Sites.Read.All',
    'Sites.ReadWrite.All',
    'https://whaylandcompany.sharepoint.com/Sites.FullControl.All' // Replace with Whayland's SharePoint domain
  ]
};

const msalInstance = new PublicClientApplication(msalConfig);

// Authentication methods
export const authService = {
  async initialize() {
    try {
      await msalInstance.initialize();
      return true;
    } catch (error) {
      console.error('MSAL initialization failed:', error);
      return false;
    }
  },

  async signIn() {
    try {
      const response = await msalInstance.loginPopup(loginRequest);
      return response;
    } catch (error) {
      console.error('Sign in failed:', error);
      throw error;
    }
  },

  async getAccessToken() {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      throw new Error('No accounts found. Please sign in first.');
    }

    const silentRequest = {
      ...loginRequest,
      account: accounts[0]
    };

    try {
      const response = await msalInstance.acquireTokenSilent(silentRequest);
      return response.accessToken;
    } catch (error) {
      console.error('Silent token acquisition failed:', error);
      // Fall back to interactive
      const response = await msalInstance.acquireTokenPopup(loginRequest);
      return response.accessToken;
    }
  },

  getCurrentUser() {
    const accounts = msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  },

  async signOut() {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      await msalInstance.logoutPopup({
        account: accounts[0]
      });
    }
  }
};

export default authService;
