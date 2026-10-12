import type { SupabaseClient } from "@supabase/supabase-js";
import { parseCharacterImageRow } from "@/content/images";
import { parsePlaceRow, sortPlaces } from "@/content/places";
import type { CharacterImage, Place } from "@/content/types";

/** Storage 버킷 이름 (supabase/migrations 참고) */
export const BUCKETS = { places: "places", characters: "characters" } as const;

/** 서명 URL 유효 시간 (초). 버킷이 비공개라 이 시간 동안만 볼 수 있는 주소를 받는다. */
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;

/** places 테이블 전체, order 순. 대시보드에서 행을 추가하면 다음 접속부터 바로 반영된다. */
export async function loadPlaces(client: SupabaseClient): Promise<Place[]> {
  const { data, error } = await client.from("places").select("*").order("order");
  if (error) throw error;
  return sortPlaces((data ?? []).map(parsePlaceRow).filter((p): p is Place => p !== null));
}

export async function loadCharacterImages(client: SupabaseClient): Promise<CharacterImage[]> {
  const { data, error } = await client.from("character_images").select("*");
  if (error) throw error;
  return (data ?? []).map(parseCharacterImageRow).filter((img): img is CharacterImage => img !== null);
}

/** 앱에 들어 있는 파일("/..." 경로)이나 전체 URL은 Storage를 거치지 않는다. */
export function isBundledPath(path: string): boolean {
  return path.startsWith("/") || /^https?:\/\//.test(path);
}

/**
 * 경로 → 화면에 쓸 URL. Storage 경로는 서명 URL을 한 번에 받아온다.
 * 받아오지 못한 경로는 결과에서 빠진다 (화면은 빈 자리 표시).
 */
export async function resolveImageUrls(
  client: SupabaseClient,
  bucket: string,
  paths: readonly string[],
): Promise<Map<string, string>> {
  const urls = new Map<string, string>();
  const storagePaths: string[] = [];
  for (const path of new Set(paths)) {
    if (isBundledPath(path)) urls.set(path, path);
    else storagePaths.push(path);
  }
  if (storagePaths.length === 0) return urls;

  const { data, error } = await client.storage.from(bucket).createSignedUrls(storagePaths, SIGNED_URL_TTL_SECONDS);
  if (error) return urls;
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
  }
  return urls;
}
