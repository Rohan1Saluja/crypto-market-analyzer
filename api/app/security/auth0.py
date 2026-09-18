from dataclasses import dataclass
from typing import Any

import httpx
import jwt
from jwt import PyJWKClient
from jwt.exceptions import PyJWTError

from app.core.exceptions import AuthenticationError, IdentityProviderError


@dataclass(frozen=True, slots=True)
class AuthenticatedIdentity:
    subject: str
    access_token: str


@dataclass(frozen=True, slots=True)
class Auth0UserProfile:
    subject: str
    email: str | None
    email_verified: bool
    name: str | None


class Auth0TokenVerifier:
    def __init__(self, *, issuer: str, audience: str, client_id: str) -> None:
        self._issuer = issuer
        self._audience = audience
        self._client_id = client_id
        self._jwks = PyJWKClient(f"{issuer}.well-known/jwks.json")

    def verify(self, token: str) -> AuthenticatedIdentity:
        try:
            signing_key = self._jwks.get_signing_key_from_jwt(token)
            claims: dict[str, Any] = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=self._audience,
                issuer=self._issuer,
                options={"require": ["exp", "iss", "aud", "sub"]},
            )
        except (PyJWTError, ValueError) as exc:
            raise AuthenticationError("Invalid or expired access token") from exc

        subject = claims.get("sub")
        if not isinstance(subject, str) or not subject:
            raise AuthenticationError("Access token is missing a valid subject")
        if claims.get("azp") != self._client_id:
            raise AuthenticationError("Access token was not issued to the Calyrn web client")

        return AuthenticatedIdentity(subject=subject, access_token=token)


class Auth0IdentityProvider:
    def __init__(self, *, issuer: str) -> None:
        self._userinfo_url = f"{issuer}userinfo"

    def get_user_profile(self, access_token: str) -> Auth0UserProfile:
        try:
            response = httpx.get(
                self._userinfo_url,
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=5.0,
            )
            response.raise_for_status()
            payload = response.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise IdentityProviderError("Auth0 user profile is temporarily unavailable") from exc

        subject = payload.get("sub")
        if not isinstance(subject, str) or not subject:
            raise IdentityProviderError("Auth0 returned an invalid user profile")

        email = payload.get("email")
        name = payload.get("name")

        return Auth0UserProfile(
            subject=subject,
            email=email if isinstance(email, str) else None,
            email_verified=payload.get("email_verified") is True,
            name=name if isinstance(name, str) else None,
        )
