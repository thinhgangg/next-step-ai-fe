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
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarUrl) {
      return;
    }

    let isActive = true;

    void (async () => {
      try {
        const { data } = await fetchAvatarFile();
        if (!isActive || !data?.getAvatarFile) return;

        const file = data.getAvatarFile;
        const blob = base64ToBlob(file.base64, file.contentType);
        const nextUrl = URL.createObjectURL(blob);

        setBlobUrl((currentUrl) => {
          if (currentUrl) {
            URL.revokeObjectURL(currentUrl);
          }

          return nextUrl;
        });
      } catch {
        if (isActive) {
          setBlobUrl((currentUrl) => {
            if (currentUrl) {
              URL.revokeObjectURL(currentUrl);
            }

            return null;
          });
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [avatarUrl, fetchAvatarFile]);

  useEffect(
    () => () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    },
    [blobUrl],
  );

  return {
    avatarSrc: avatarUrl ? blobUrl : null,
  };
}
