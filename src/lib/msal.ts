import { PublicClientApplication, Configuration } from '@azure/msal-browser';

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_UP_CLIENT_ID!,
    authority: process.env.NEXT_PUBLIC_UP_AUTH_URL!.replace('/oauth2/v2.0/authorize', ''),
    redirectUri: 'http://localhost:3000/callback/azure',
    postLogoutRedirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/Login`
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case 0: console.error(message); return;
          case 1: console.warn(message); return;
          case 2: console.info(message); return;
          case 3: console.debug(message); return;
          default: return;
        }
      },
      logLevel: 3,
    }
  }
};

export const msalInstance = new PublicClientApplication(msalConfig);