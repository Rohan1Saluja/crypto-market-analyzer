import httpx

from app.providers.news import GoogleNewsProvider


def test_google_news_feed_is_mapped_to_coin_news() -> None:
    rss = """<?xml version="1.0" encoding="UTF-8"?>
    <rss>
      <channel>
        <item>
          <title>Bitcoin moves higher - Reuters</title>
          <link>https://news.google.com/articles/example</link>
          <pubDate>Fri, 18 Sep 2026 00:00:00 GMT</pubDate>
          <source>Reuters</source>
        </item>
      </channel>
    </rss>
    """

    def handler(request: httpx.Request) -> httpx.Response:
        assert "Bitcoin" in request.url.params["q"]
        assert request.url.params["ceid"] == "US:en"
        return httpx.Response(200, text=rss)

    provider = GoogleNewsProvider(
        cache_ttl_seconds=300,
        transport=httpx.MockTransport(handler),
    )

    try:
        news = provider.get_coin_news(name="Bitcoin", symbol="BTC")
    finally:
        provider.close()

    assert news[0].title == "Bitcoin moves higher"
    assert news[0].source == "Reuters"
    assert news[0].published_at == "2026-09-18T00:00:00Z"
