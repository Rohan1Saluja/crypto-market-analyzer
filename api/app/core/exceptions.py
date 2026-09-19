class MarketDataProviderError(RuntimeError):
    pass


class MarketDataRateLimitError(MarketDataProviderError):
    pass


class WalletPortfolioProviderError(RuntimeError):
    pass


class WalletPortfolioRateLimitError(WalletPortfolioProviderError):
    pass


class WalletAlreadyTrackedError(RuntimeError):
    pass


class WalletNotFoundError(RuntimeError):
    pass


class WalletSnapshotMismatchError(RuntimeError):
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
