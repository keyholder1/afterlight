import { useEffect, useState } from 'react';
import { getSignedUrl } from '../sync/signedUrls';
import type { LocalMemory } from '../db/memories';

// Local file if this device has it (own captures, or a partner's photo
// already downloaded — not implemented yet, always false for partner rows
// today), otherwise a lazily-resolved signed URL for the thumbnail.
export function useDisplayUri(memory: LocalMemory): string | undefined {
  const localUri = memory.local_thumb_uri ?? memory.local_uri ?? undefined;
  const [remoteUri, setRemoteUri] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (localUri || !memory.remote_thumb_path) return;
    let cancelled = false;
    getSignedUrl(memory.remote_thumb_path).then((url) => {
      if (!cancelled && url) setRemoteUri(url);
    });
    return () => {
      cancelled = true;
    };
  }, [localUri, memory.remote_thumb_path]);

  return localUri ?? remoteUri;
}
