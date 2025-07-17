// Microsoft Authentication Library Configuration
// This will handle M365 login and auto-populate the Superintendent field

import { PublicClientApplication } from '@azure/msal-browser';

const msalConfig = {
    auth: {
        clientId: "6282843f-5ffa-4587-aeaf-ca5adbb0387e", // Whayland's Application (client) ID
        authority: "https://login.microsoftonline.com/e4d3c722-fd91-46f0-99bd-2d2fe4c58ab6", // Whayland's Directory (tenant) ID
        redirectUri: "http://localhost:3000",
        postLogoutRedirectUri: "http://localhost:3000",
        navigateToLoginRequestUrl: false
    },
    cache: {
        cacheLocation: "localStorage", 
        storeAuthStateInCookie: false
    },
    system: {
        allowNativeBroker: false,
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: 3
        }
    }
};

const loginRequest = {
    scopes: [
        "user.read",
        "https://graph.microsoft.com/Sites.Read.All",
        "https://graph.microsoft.com/Sites.ReadWrite.All"
    ]
};

// Initialize MSAL instance
let msalInstance;

export function initializeAuth() {
    try {
        msalInstance = new PublicClientApplication(msalConfig);
        return msalInstance.initialize().then(() => {
            // Handle redirect response if coming back from login
            return msalInstance.handleRedirectPromise();
        });
    } catch (error) {
        console.error('Error initializing MSAL:', error);
        throw error;
    }
}

export async function signIn() {
    try {
        const loginResponse = await msalInstance.loginRedirect(loginRequest);
        return loginResponse;
    } catch (error) {
        console.error('Error during sign in:', error);
        throw error;
    }
}

export async function getAccessToken() {
    try {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length === 0) {
            throw new Error('No accounts found');
        }

        const request = {
            ...loginRequest,
            account: accounts[0]
        };

        const response = await msalInstance.acquireTokenSilent(request);
        return response.accessToken;
    } catch (error) {
        console.error('Error getting access token:', error);
        // Fall back to interactive token acquisition
        try {
            const response = await msalInstance.acquireTokenPopup(loginRequest);
            return response.accessToken;
        } catch (interactiveError) {
            console.error('Error in interactive token acquisition:', interactiveError);
            throw interactiveError;
        }
    }
}

export function getCurrentUser() {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
        return {
            displayName: accounts[0].name,
            email: accounts[0].username,
            firstName: accounts[0].name?.split(' ')[0] || '',
            lastName: accounts[0].name?.split(' ').slice(1).join(' ') || ''
        };
    }
    return null;
}

export function isSignedIn() {
    return msalInstance.getAllAccounts().length > 0;
}

export async function signOut() {
    try {
        await msalInstance.logoutPopup();
    } catch (error) {
        console.error('Error during sign out:', error);
        throw error;
    }
}
