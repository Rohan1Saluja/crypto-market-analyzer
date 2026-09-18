from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import IdentityConflictError, VerifiedEmailRequiredError
from app.models.user import User
from app.security.auth0 import Auth0IdentityProvider, AuthenticatedIdentity


class UserService:
    def resolve_authenticated_user(
        self,
        *,
        session: Session,
        identity: AuthenticatedIdentity,
        identity_provider: Auth0IdentityProvider,
    ) -> User:
        existing = session.scalar(
            select(User).where(User.auth_subject == identity.subject),
        )
        if existing is not None:
            return existing

        profile = identity_provider.get_user_profile(identity.access_token)
        if profile.subject != identity.subject:
            raise IdentityConflictError("Auth0 subject mismatch")
        if not profile.email or not profile.email_verified:
            raise VerifiedEmailRequiredError("A verified email address is required")

        normalized_email = profile.email.strip().lower()
        existing = session.scalar(
            select(User)
            .where(func.lower(User.email) == normalized_email)
            .with_for_update(),
        )

        if existing is not None:
            if existing.auth_subject not in {None, identity.subject}:
                raise IdentityConflictError("Email is already linked to another identity")

            existing.auth_subject = identity.subject
            if existing.display_name is None and profile.name:
                existing.display_name = profile.name
            user = existing
        else:
            user = User(
                email=normalized_email,
                display_name=profile.name,
                auth_subject=identity.subject,
            )
            session.add(user)

        try:
            session.commit()
        except IntegrityError as exc:
            session.rollback()
            raced_user = session.scalar(
                select(User).where(User.auth_subject == identity.subject),
            )
            if raced_user is not None:
                return raced_user
            raise IdentityConflictError("Unable to link authenticated identity") from exc

        session.refresh(user)
        return user
