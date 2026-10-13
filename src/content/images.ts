import { isDanger, isWarning } from "@/game/hyejin";
import type { GameEvent, Rng } from "@/game/types";
import {
  DEFAULT_FACE_TAG,
  FACE_EVENT_TAGS,
  FULL_BODY_POOLS,
  JUNGWOO_FACE_TAGS,
  JUNGWOO_POSES,
  type CharacterImage,
  type CharacterName,
  type FaceEventTag,
  type FullBodyPool,
  type ImageKind,
  type JungwooFaceTag,
  type JungwooPose,
} from "./types";

function imagesOf(images: readonly CharacterImage[], character: CharacterName, kind: ImageKind, tag: string) {
  return images.filter((img) => img.character === character && img.kind === kind && img.tags.includes(tag));
}

function pickRandom<T>(items: readonly T[], rng: Rng): T | null {
  if (items.length === 0) return null;
  return items[Math.min(items.length - 1, Math.floor(rng() * items.length))];
}

/**
 * 혜진 행복도에 맞는 전신 풀 순서. 앞의 풀이 비어 있으면 다음 풀을 쓴다.
 * - 30 초과: normal
 * - 30 이하: sad (비면 normal)
 * - 20 이하: danger (비면 sad, 그것도 비면 normal)
 */
export function fullBodyPoolOrder(happiness: number): FullBodyPool[] {
  if (isDanger(happiness)) return ["danger", "sad", "normal"];
  if (isWarning(happiness)) return ["sad", "normal"];
  return ["normal"];
}

/**
 * 메인 화면 혜진 전신 그림 고르기. 앱을 열 때, 정우 행동 후, 혜진을 탭할 때 호출한다.
 * 직전 그림(previousId)은 연속으로 고르지 않는다. 풀에 그 한 장뿐이면 예외.
 * 쓸 수 있는 그림이 하나도 없으면 null (화면은 빈 자리 표시).
 */
export function pickFullBody(
  images: readonly CharacterImage[],
  happiness: number,
  previousId: string | null,
  rng: Rng,
): CharacterImage | null {
  for (const pool of fullBodyPoolOrder(happiness)) {
    const candidates = imagesOf(images, "hyejin", "full", pool);
    if (candidates.length === 0) continue;
    const fresh = candidates.filter((img) => img.id !== previousId);
    return pickRandom(fresh.length > 0 ? fresh : candidates, rng);
  }
  return null;
}

/**
 * 이벤트 팝업 혜진 얼굴 고르기. 그 태그가 붙은 얼굴 중 무작위,
 * 없으면 default 태그 얼굴, 그것도 없으면 null.
 */
export function pickFace(images: readonly CharacterImage[], tag: FaceEventTag, rng: Rng): CharacterImage | null {
  return (
    pickRandom(imagesOf(images, "hyejin", "face", tag), rng) ??
    pickRandom(imagesOf(images, "hyejin", "face", DEFAULT_FACE_TAG), rng)
  );
}

/** 게임 이벤트 → 얼굴 이벤트 태그. 얼굴을 띄우지 않는 이벤트는 null. */
export function faceTagForEvent(event: GameEvent): FaceEventTag | null {
  switch (event.type) {
    case "fed":
      return "eat_mochi";
    case "leveledUp":
      return "level_up";
    case "warningStarted":
      return "warning";
    case "countdownStarted":
      return "countdown";
    case "jungwooBlocked":
      return "jeongwoo_block";
    case "halfEaten":
      return "eat_half";
    case "bulldakCraving":
      return "buldak_craving";
    case "bulldakResolved":
      return "buldak_eat";
    case "playedTogether":
      return "play_together";
    case "dated":
      return `date_${event.stars}star`;
    case "newPlacesAdded":
      return "new_place";
    default:
      return null;
  }
}

/**
 * 정우 카드에 세울 전신 그림. 삐져 있으면 무조건 sulk, 아니면 그 포즈 → idle 순으로 찾는다.
 * 같은 포즈에 여러 장이면 직전 그림(previousId)을 피해서 고른다. 하나도 없으면 null (이모지 표시).
 */
export function pickJungwooPose(
  images: readonly CharacterImage[],
  pose: JungwooPose,
  sulking: boolean,
  previousId: string | null,
  rng: Rng,
): CharacterImage | null {
  const order: JungwooPose[] = sulking ? ["sulk", "idle"] : [pose, "idle"];
  for (const tag of order) {
    const candidates = imagesOf(images, "jeongwoo", "full", tag);
    if (candidates.length === 0) continue;
    const fresh = candidates.filter((img) => img.id !== previousId);
    return pickRandom(fresh.length > 0 ? fresh : candidates, rng);
  }
  return null;
}

/** 정우가 주인공인 팝업의 정우 얼굴. 없으면 null. */
export function pickJungwooFace(images: readonly CharacterImage[], tag: JungwooFaceTag, rng: Rng): CharacterImage | null {
  return pickRandom(imagesOf(images, "jeongwoo", "face", tag), rng);
}

const KNOWN_TAGS: Record<CharacterName, Set<string>> = {
  hyejin: new Set<string>([...FULL_BODY_POOLS, ...FACE_EVENT_TAGS, DEFAULT_FACE_TAG]),
  jeongwoo: new Set<string>([...JUNGWOO_POSES, ...JUNGWOO_FACE_TAGS]),
};

/** DB 행 → CharacterImage. 형식이 틀린 행은 null (게임이 멈추지 않게 건너뛴다). */
export function parseCharacterImageRow(row: Record<string, unknown>): CharacterImage | null {
  const { id, character, kind, tags, path, description } = row;
  if (typeof id !== "string" || typeof path !== "string" || path.trim() === "") return null;
  if (character !== "hyejin" && character !== "jeongwoo") return null;
  if (kind !== "full" && kind !== "face") return null;
  const tagList = Array.isArray(tags)
    ? tags.filter((t): t is string => typeof t === "string").map((t) => t.trim())
    : [];
  return {
    id,
    character,
    kind,
    tags: tagList,
    path,
    description: typeof description === "string" ? description : null,
  };
}

/** 알 수 없는 태그 (오타 확인용) */
export function unknownTags(image: CharacterImage): string[] {
  return image.tags.filter((t) => !KNOWN_TAGS[image.character].has(t));
}
