import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CHARACTER_ART } from "../characterArt";
import { unknownTags } from "../images";
import { DEFAULT_FACE_TAG, FACE_EVENT_TAGS, FULL_BODY_POOLS, JUNGWOO_FACE_TAGS, JUNGWOO_POSES } from "../types";

const ROOT = join(__dirname, "..", "..", "..");
const SEED = ["20261013000300_seed_hyejin_art.sql", "20261013000400_seed_jeongwoo_art.sql"]
  .map((f) => readFileSync(join(ROOT, "supabase", "migrations", f), "utf8"))
  .join("\n");

const has = (character: "hyejin" | "jeongwoo", kind: "full" | "face", tag: string) =>
  CHARACTER_ART.some((i) => i.character === character && i.kind === kind && i.tags.includes(tag));

describe("앱에 들어 있는 캐릭터 그림", () => {
  it("모든 그림 파일이 public 안에 있다", () => {
    for (const img of CHARACTER_ART) expect(existsSync(join(ROOT, "public", img.path)), img.path).toBe(true);
  });

  it("오타 태그가 없고 id가 겹치지 않는다", () => {
    expect(CHARACTER_ART.flatMap(unknownTags)).toEqual([]);
    expect(new Set(CHARACTER_ART.map((i) => i.id)).size).toBe(CHARACTER_ART.length);
  });

  it("혜진 전신 풀과 얼굴 이벤트 태그가 하나도 비지 않는다", () => {
    for (const pool of FULL_BODY_POOLS) expect(has("hyejin", "full", pool), pool).toBe(true);
    for (const tag of [...FACE_EVENT_TAGS, DEFAULT_FACE_TAG]) expect(has("hyejin", "face", tag), tag).toBe(true);
  });

  it("정우 포즈와 얼굴 태그가 하나도 비지 않는다", () => {
    for (const pose of JUNGWOO_POSES) expect(has("jeongwoo", "full", pose), pose).toBe(true);
    for (const tag of JUNGWOO_FACE_TAGS) expect(has("jeongwoo", "face", tag), tag).toBe(true);
  });

  it("시드 SQL과 같은 내용이다", () => {
    for (const img of CHARACTER_ART) {
      expect(SEED).toContain(`('${img.id}', '${img.character}', '${img.kind}', '{${img.tags.join(",")}}', '${img.path}'`);
    }
  });
});
