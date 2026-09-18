import "server-only";

import { Auth0Client } from "@auth0/nextjs-auth0/server";

const audience = process.env.AUTH0_AUDIENCE;

if (!audience) {
  throw new Error("AUTH0_AUDIENCE is required");
}

export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience,
    scope: "openid profile email offline_access",
  },
  // Calyrn never exposes an access-token endpoint to browser JavaScript.
  enableAccessTokenEndpoint: false,
});
