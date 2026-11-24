"""Read members of a large zip file over HTTP without downloading the whole archive.

The server must support HTTP range requests (figshare and Zenodo do). Python's
zipfile only needs a seekable file object, so this module provides one that
fetches byte ranges on demand and keeps a small block cache.
"""
from __future__ import annotations

import io
import time
import urllib.request
import zipfile

BLOCK = 1 << 20  # 1 MiB blocks


def resolve(url: str) -> str:
    """Follow redirects once, so every range request goes straight to the storage server."""
    # A one-byte GET, because signed storage URLs often refuse HEAD.
    req = urllib.request.Request(url, headers={"Range": "bytes=0-0", "User-Agent": "urbanfix-research"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.geturl()


class HttpRangeFile(io.RawIOBase):
    def __init__(self, url: str, size: int | None = None, cache_blocks: int = 64):
        # Keep the public URL: signed redirect targets can expire within seconds,
        # and urllib keeps the Range header when it follows the redirect.
        self.url = url
        self.pos = 0
        self.cache: dict[int, bytes] = {}
        self.cache_blocks = cache_blocks
        self.size = size if size is not None else self._head_size()

    def _head_size(self) -> int:
        req = urllib.request.Request(self.url, headers={"Range": "bytes=0-0", "User-Agent": "urbanfix-research"})
        with urllib.request.urlopen(req, timeout=60) as r:
            return int(r.headers["Content-Range"].split("/")[-1])

    def _get(self, start: int, end: int) -> bytes:
        """Fetch bytes [start, end] inclusive, with retries."""
        for attempt in range(5):
            try:
                req = urllib.request.Request(
                    self.url, headers={"Range": f"bytes={start}-{end}", "User-Agent": "urbanfix-research"}
                )
                with urllib.request.urlopen(req, timeout=120) as r:
                    data = r.read()
                if len(data) == end - start + 1:
                    return data
            except Exception:
                if attempt == 4:
                    raise
            time.sleep(2 ** attempt)
        raise IOError(f"short read for bytes {start}-{end}")

    def _block(self, i: int) -> bytes:
        if i not in self.cache:
            if len(self.cache) >= self.cache_blocks:
                self.cache.pop(next(iter(self.cache)))
            start = i * BLOCK
            self.cache[i] = self._get(start, min(start + BLOCK, self.size) - 1)
        return self.cache[i]

    def readable(self) -> bool:
        return True

    def seekable(self) -> bool:
        return True

    def tell(self) -> int:
        return self.pos

    def seek(self, offset: int, whence: int = io.SEEK_SET) -> int:
        if whence == io.SEEK_SET:
            self.pos = offset
        elif whence == io.SEEK_CUR:
            self.pos += offset
        else:
            self.pos = self.size + offset
        return self.pos

    def read(self, n: int = -1) -> bytes:
        if n is None or n < 0:
            n = self.size - self.pos
        n = max(0, min(n, self.size - self.pos))
        if n == 0:
            return b""
        # Large reads (whole images) bypass the block cache.
        if n > 4 * BLOCK:
            data = self._get(self.pos, self.pos + n - 1)
        else:
            out = bytearray()
            p = self.pos
            while len(out) < n:
                b = self._block(p // BLOCK)
                off = p % BLOCK
                chunk = b[off: off + n - len(out)]
                out += chunk
                p += len(chunk)
            data = bytes(out)
        self.pos += len(data)
        return data

    def readinto(self, b) -> int:
        data = self.read(len(b))
        b[: len(data)] = data
        return len(data)


def open_remote_zip(url: str) -> zipfile.ZipFile:
    return zipfile.ZipFile(io.BufferedReader(HttpRangeFile(url), buffer_size=BLOCK))


def read_member(url: str, info: zipfile.ZipInfo, raw: HttpRangeFile | None = None) -> bytes:
    """Read one member with its own connection (safe to call from threads)."""
    raw = raw or HttpRangeFile(url)
    with zipfile.ZipFile(raw) as z:
        return z.read(info)
