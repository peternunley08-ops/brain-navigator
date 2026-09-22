import { File } from 'expo-file-system';
import { supabase } from './supabase';

const BUCKET = 'snapshot-images';

// Uploads a local image URI (from expo-image-picker) to Supabase Storage and
// returns its public URL, or null on failure.
export async function uploadSnapshotImage(localUri: string, entryId: string): Promise<string | null> {
  try {
    const file = new File(localUri);
    const bytes = await file.arrayBuffer();
    const path = `entries/${entryId}/${Date.now()}.jpg`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: 'image/jpeg',
    });
    if (error) return null;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}
