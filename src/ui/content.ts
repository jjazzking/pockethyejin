import { PLACEHOLDER_IMAGES, PLACEHOLDER_PLACES } from "@/content/placeholders";
import { getSupabase } from "@/lib/supabase";
import { BUCKETS, loadCharacterImages, loadPlaces, resolveImageUrls } from "@/persistence/contentRepo";
import type { Content } from "./useGame";

/** Supabase에서 장소·그림을 읽고 표시 URL을 받아온다 */
export async function loadSupabaseContent(): Promise<Content> {
  const client = getSupabase();
  const [places, images] = await Promise.all([loadPlaces(client), loadCharacterImages(client)]);
  const [imageUrls, placeUrls] = await Promise.all([
    resolveImageUrls(client, BUCKETS.characters, images.map((i) => i.path)),
    resolveImageUrls(client, BUCKETS.places, places.flatMap((p) => (p.image ? [p.image] : []))),
  ]);
  return { places, images, imageUrls, placeUrls };
}

/** 체험 모드: 앱에 들어 있는 임시 장소·그림 */
export async function loadTrialContent(): Promise<Content> {
  const paths = [...PLACEHOLDER_IMAGES.map((i) => i.path), ...PLACEHOLDER_PLACES.flatMap((p) => (p.image ? [p.image] : []))];
  const urls = new Map(paths.map((path) => [path, path]));
  return { places: PLACEHOLDER_PLACES, images: PLACEHOLDER_IMAGES, imageUrls: urls, placeUrls: urls };
}
