import { supabase } from './supabase';

const MEMORY_MEDIA_BUCKET = 'memory-media';

/**
 * Upload a photo to the memory-media bucket.
 * Returns the public URL path (not a full URL - use getSignedUrl to fetch).
 */
export async function uploadMemoryPhoto(
  memoryId: string,
  file: { uri: string; name: string; type: string }
): Promise<string> {
  const fileName = `${memoryId}/${Date.now()}_${file.name}`;

  // Convert React Native file URI to blob using XMLHttpRequest
  const blob = await new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      console.error('[storage] Blob conversion failed:', e);
      reject(new TypeError('Network request failed'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', file.uri, true);
    xhr.send(null);
  });

  const { data, error } = await supabase.storage
    .from(MEMORY_MEDIA_BUCKET)
    .upload(fileName, blob, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    });

  if (error) throw error;
  return data.path;
}

/**
 * Upload an avatar to the public 'avatars' bucket.
 * Returns the public URL of the uploaded avatar.
 */
export async function uploadAvatar(
  userId: string,
  file: { uri: string; name: string; type: string }
): Promise<string> {
  const fileName = `${userId}/${Date.now()}_${file.name}`;

  // Convert React Native file URI to blob using XMLHttpRequest
  const blob = await new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      console.error('[storage] Blob conversion failed:', e);
      reject(new TypeError('Network request failed'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', file.uri, true);
    xhr.send(null);
  });

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, blob, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Get a signed URL for a memory media file.
 * This is required because the memory-media bucket is private.
 */
export async function getSignedMemoryUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(MEMORY_MEDIA_BUCKET)
    .createSignedUrl(path, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Delete a memory media file from storage.
 */
export async function deleteMemoryPhoto(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(MEMORY_MEDIA_BUCKET)
    .remove([path]);

  if (error) throw error;
}

/**
 * Get multiple signed URLs for memory media.
 */
export async function getSignedMemoryUrls(paths: string[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  for (const path of paths) {
    try {
      const url = await getSignedMemoryUrl(path);
      result.set(path, url);
    } catch (error) {
      console.error(`[storage] Failed to get signed URL for ${path}:`, error);
    }
  }

  return result;
}
