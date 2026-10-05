import { File } from 'expo-file-system';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';

const BUCKET = 'snapshot-images';
// Signed links are short-lived: a photo link that gets copied stops working.
const SIGNED_FOR_S = 60 * 60;

// Uploads a local image URI (from expo-image-picker) to Supabase Storage and
// returns its storage path (stored in cognitive_state.image_url), or null on
// failure. The bucket is private; photos are shown through signed links.
export async function uploadSnapshotImage(localUri: string, entryId: string): Promise<string | null> {
  try {
    const file = new File(localUri);
    const bytes = await file.arrayBuffer();
    const path = `entries/${entryId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: 'image/jpeg' });
    return error ? null : path;
  } catch {
    return null;
  }
}

/** The storage path for a stored image: a path as-is, or the path inside an older public URL. */
export function imagePath(stored: string): string | null {
  if (!/^https?:\/\//.test(stored)) return stored.replace(/^\/+/, '') || null;
  const m = stored.match(new RegExp(`/storage/v1/object/(?:public|sign)/${BUCKET}/([^?]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** A short-lived link to show a stored entry photo, or null while loading or if it can't be read. */
export function useSnapshotImage(stored: string | null | undefined) {
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    setUri(null);
    const path = stored ? imagePath(stored) : null;
    if (!path) return;
    let live = true;
    supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_FOR_S)
      .then(({ data }) => {
        if (live) setUri(data?.signedUrl ?? null);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [stored]);
  return uri;
}
