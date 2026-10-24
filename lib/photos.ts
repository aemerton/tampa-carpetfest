import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

export type PhotoKind = "profile" | "pet-reptile" | "other-pet";

/**
 * Lets the person pick a photo, uploads it to their own folder in the
 * `photos` bucket, and returns its public URL (or null if they cancelled).
 */
export async function pickAndUploadPhoto(
  userId: string,
  kind: PhotoKind
): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  const contentType = asset.mimeType ?? "image/jpeg";
  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `${userId}/${kind}-${Date.now()}.${ext}`;

  const body = await fetch(asset.uri).then((r) => r.arrayBuffer());
  const { error } = await supabase.storage
    .from("photos")
    .upload(path, body, { contentType });
  if (error) throw error;

  return supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
}
