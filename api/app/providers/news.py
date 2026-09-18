from datetime import timezone
from email.utils import parsedate_to_datetime
from xml.etree import ElementTree

import httpx

from app.core.cache import TtlCache
from app.core.exceptions import MarketDataProviderError
from app.schemas.coin import CoinNewsItem


class GoogleNewsProvider:
    def __init__(
        self,
        *,
        cache_ttl_seconds: int,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self._cache_ttl_seconds = cache_ttl_seconds
        self._cache = TtlCache()
        self._client = httpx.Client(
            base_url="https://news.google.com/rss/",
            headers={
                "accept": "application/rss+xml, application/xml, text/xml",
                "user-agent": "CryptoMarketAnalyzer/0.1",
            },
            timeout=httpx.Timeout(8.0),
            follow_redirects=True,
            transport=transport,
        )

    def close(self) -> None:
        self._client.close()

    def get_coin_news(
        self,
        *,
        name: str,
        symbol: str,
        limit: int = 6,
    ) -> list[CoinNewsItem]:
        query = f'"{name}" cryptocurrency {symbol}'
        cache_key = f"news:{query.lower()}:{limit}"

        def loader() -> list[CoinNewsItem]:
            try:
                response = self._client.get(
                    "search",
                    params={
                        "q": query,
                        "hl": "en-US",
                        "gl": "US",
                        "ceid": "US:en",
                    },
                )
                response.raise_for_status()
            except httpx.HTTPError as error:
                raise MarketDataProviderError("News feed request failed.") from error

            try:
                root = ElementTree.fromstring(response.text)
            except ElementTree.ParseError as error:
                raise MarketDataProviderError("News feed returned invalid XML.") from error

            items: list[CoinNewsItem] = []

            for item in root.findall("./channel/item"):
                title = self._element_text(item.find("title"))
                link = self._element_text(item.find("link"))
                source = self._element_text(item.find("source")) or "Google News"

                if not title or not link or not link.startswith(("https://", "http://")):
                    continue

                suffix = f" - {source}"
                if title.endswith(suffix):
                    title = title[: -len(suffix)]

                items.append(
                    CoinNewsItem(
                        title=title,
                        source=source,
                        url=link,
                        published_at=self._published_at(
                            self._element_text(item.find("pubDate")),
                        ),
                    )
                )

                if len(items) >= limit:
                    break

            return items

        return self._cache.get_or_load(
            cache_key,
            ttl_seconds=self._cache_ttl_seconds,
            loader=loader,
        )

    @staticmethod
    def _element_text(element: ElementTree.Element | None) -> str | None:
        if element is None or not element.text:
            return None

        value = element.text.strip()
        return value or None

    @staticmethod
    def _published_at(value: str | None) -> str | None:
        if value is None:
            return None

        try:
            parsed = parsedate_to_datetime(value)
        except (TypeError, ValueError):
            return None

        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)

        return parsed.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
