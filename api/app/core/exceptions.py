class MarketDataProviderError(RuntimeError):
    pass


class MarketDataRateLimitError(MarketDataProviderError):
    pass


class TechnicalAnalysisUnavailableError(RuntimeError):
    pass


class AuthenticationError(RuntimeError):
    pass


class IdentityProviderError(RuntimeError):
    pass


class IdentityConflictError(RuntimeError):
    pass


class VerifiedEmailRequiredError(RuntimeError):
    pass
