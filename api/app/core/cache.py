from collections.abc import Callable
from dataclasses import dataclass
from threading import RLock
from time import monotonic
from typing import cast


@dataclass(slots=True)
class CacheEntry[T]:
    value: T
    expires_at: float


class TtlCache:
    def __init__(self) -> None:
        self._entries: dict[str, CacheEntry[object]] = {}
        self._lock = RLock()

    def get_or_load[T](
        self,
        key: str,
        *,
        ttl_seconds: int,
        loader: Callable[[], T],
    ) -> T:
        now = monotonic()

        with self._lock:
            entry = self._entries.get(key)

            if entry is not None and entry.expires_at > now:
                return cast(T, entry.value)

            value = loader()
            self._entries[key] = CacheEntry(
                value=value,
                expires_at=monotonic() + ttl_seconds,
            )
            return value
