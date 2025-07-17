// Microsoft Authentication Library Configuration
// This will handle M365 login and auto-populate the Superintendent field

const msalConfig = {
    auth: {
        clientId: "YOUR_AZURE_APP_CLIENT_ID", // You'll need to register an Azure AD app
        authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
        redirectUri: window.location.origin,
        postLogoutRedirectUri: window.location.origin
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false
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
        msalInstance = new msal.PublicClientApplication(msalConfig);
        return msalInstance.initialize();
    } catch (error) {
        console.error('Error initializing MSAL:', error);
        throw error;
    }
}

export async function signIn() {
    try {
        const loginResponse = await msalInstance.loginPopup(loginRequest);
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
