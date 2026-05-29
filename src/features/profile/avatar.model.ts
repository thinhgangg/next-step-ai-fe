import { useEffect, useState } from "react";
import { useLazyQuery } from "@apollo/client/react";
import { GET_AVATAR_FILE } from "./avatar.query";

type AvatarFileResponse = {
  getAvatarFile: {
    fileName: string;
    contentType: string;
    base64: string;
  };
};

const avatarObjectUrlCache = new Map<string, string>();
const avatarRequestCache = new Map<string, Promise<string | null>>();
const AVATAR_SESSION_CACHE_PREFIX = "nextstep.avatar.";

function shouldFetchAvatarFile(avatarUrl: string) {
  try {
    return new URL(avatarUrl).pathname.includes("/avatars/");
  } catch {
    return false;
  }
}

function getAvatarCacheKey(avatarUrl: string) {
  return `${AVATAR_SESSION_CACHE_PREFIX}${avatarUrl}`;
}

function readCachedAvatar(avatarUrl: string) {
  try {
    return sessionStorage.getItem(getAvatarCacheKey(avatarUrl));
  } catch {
    return null;
  }
}

function writeCachedAvatar(avatarUrl: string, dataUrl: string) {
  try {
    sessionStorage.setItem(getAvatarCacheKey(avatarUrl), dataUrl);
  } catch {
    // Ignore quota/security errors; memory cache still handles this session.
  }
}

function base64ToBlob(base64: string, contentType: string) {
  const byteCharacters = atob(base64);
  const byteArrays: ArrayBuffer[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
    const slice = byteCharacters.slice(offset, offset + 1024);
    const byteNumbers = new Array(slice.length);

    for (let index = 0; index < slice.length; index += 1) {
      byteNumbers[index] = slice.charCodeAt(index);
    }

    const bytes = new Uint8Array(byteNumbers);
    byteArrays.push(bytes.buffer.slice(0));
  }

  return new Blob(byteArrays, {
    type: contentType || "application/octet-stream",
  });
}

export function useAvatarFile(avatarUrl?: string | null) {
  const [fetchAvatarFile] = useLazyQuery<AvatarFileResponse>(GET_AVATAR_FILE, {
    fetchPolicy: "network-only",
  });
  const [blobUrl, setBlobUrl] = useState<string | null>(() =>
    avatarUrl
      ? avatarObjectUrlCache.get(avatarUrl) ?? readCachedAvatar(avatarUrl) ?? avatarUrl
      : null,
  );

  useEffect(() => {
    if (!avatarUrl) {
      setBlobUrl(null);
      return;
    }

    if (!shouldFetchAvatarFile(avatarUrl)) {
      setBlobUrl(avatarUrl);
      return;
    }

    const cachedAvatarSrc = avatarObjectUrlCache.get(avatarUrl);

    if (cachedAvatarSrc) {
      setBlobUrl(cachedAvatarSrc);
      return;
    }

    const sessionCachedAvatarSrc = readCachedAvatar(avatarUrl);

    if (sessionCachedAvatarSrc) {
      avatarObjectUrlCache.set(avatarUrl, sessionCachedAvatarSrc);
      setBlobUrl(sessionCachedAvatarSrc);
      return;
    }

    setBlobUrl((currentUrl) =>
      currentUrl && currentUrl !== avatarUrl ? currentUrl : null,
    );

    let isActive = true;

    void (async () => {
      try {
        let request = avatarRequestCache.get(avatarUrl);

        if (!request) {
          request = fetchAvatarFile()
            .then(({ data }) => {
              if (!data?.getAvatarFile) return null;

              const file = data.getAvatarFile;
              const dataUrl = `data:${file.contentType || "application/octet-stream"};base64,${file.base64}`;
              const blob = base64ToBlob(file.base64, file.contentType);
              const nextUrl = URL.createObjectURL(blob);

              avatarObjectUrlCache.set(avatarUrl, nextUrl);
              writeCachedAvatar(avatarUrl, dataUrl);

              return nextUrl;
            })
            .finally(() => {
              avatarRequestCache.delete(avatarUrl);
            });

          avatarRequestCache.set(avatarUrl, request);
        }

        const nextUrl = await request;

        if (isActive && nextUrl) {
          setBlobUrl(nextUrl);
        }
      } catch {
        if (isActive) {
          const fallbackAvatarSrc = avatarObjectUrlCache.get(avatarUrl);
          setBlobUrl(fallbackAvatarSrc ?? null);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [avatarUrl, fetchAvatarFile]);

  return {
    avatarSrc: avatarUrl ? blobUrl : null,
  };
}
