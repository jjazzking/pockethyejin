import type { GameState, Stars } from "@/game/types";
import type { Place } from "./types";

/** order 순으로 정렬한다. 규칙 엔진에는 항상 이 순서로 넘긴다. */
export function sortPlaces(places: readonly Place[]): Place[] {
  return [...places].sort((a, b) => a.order - b.order);
}

export type MapSpot =
  | { unlocked: true; place: Place; bestStars: Stars | null }
  /** 해금 전 장소는 순서만 보여주고 내용은 가린다 */
  | { unlocked: false; order: number };

/** 맵/앨범 표시용: 장소마다 해금 여부와 최고 별 개수 */
export function buildMap(places: readonly Place[], state: GameState): MapSpot[] {
  return sortPlaces(places).map((place, index) =>
    index < state.hyejin.level
      ? { unlocked: true, place, bestStars: state.bestStars[place.id] ?? null }
      : { unlocked: false, order: place.order },
  );
}

const asText = (v: unknown): string | null => (typeof v === "string" && v.trim() !== "" ? v : null);

/**
 * DB 행 → Place. 대시보드에서 손으로 넣은 행이라 빠진 값이 있어도 게임이 멈추지 않게 채운다.
 * id나 order가 없는 행은 쓸 수 없으므로 null.
 */
export function parsePlaceRow(row: Record<string, unknown>): Place | null {
  const id = asText(row.id);
  const order = typeof row.order === "number" ? row.order : Number(row.order);
  if (!id || !Number.isFinite(order)) return null;

  const raw = (row.episodes && typeof row.episodes === "object" ? row.episodes : {}) as Record<string, unknown>;
  const episode = (stars: Stars) => asText(raw[String(stars)]) ?? "";
  const image = asText(row.image);
  const extra = Array.isArray(row.photos) ? row.photos.map(asText).filter((p): p is string => p !== null) : [];
  return {
    id,
    order,
    name: asText(row.name) ?? "이름 없는 장소",
    date: asText(row.date),
    image,
    photos: [...new Set([...(image ? [image] : []), ...extra])],
    episodes: { 1: episode(1), 2: episode(2), 3: episode(3) },
  };
}
