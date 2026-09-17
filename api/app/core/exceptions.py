class MarketDataProviderError(RuntimeError):
    pass


class MarketDataRateLimitError(MarketDataProviderError):
    pass


class TechnicalAnalysisUnavailableError(RuntimeError):
    pass
