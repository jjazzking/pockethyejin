import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { HYEJIN_ART } from "../characterArt";
import { unknownTags } from "../images";
import { DEFAULT_FACE_TAG, FACE_EVENT_TAGS, FULL_BODY_POOLS } from "../types";

const ROOT = join(__dirname, "..", "..", "..");
const SEED = readFileSync(join(ROOT, "supabase", "migrations", "20261013000300_seed_hyejin_art.sql"), "utf8");

describe("혜진 그림 목록", () => {
  it("모든 그림 파일이 public 안에 있다", () => {
    for (const img of HYEJIN_ART) expect(existsSync(join(ROOT, "public", img.path)), img.path).toBe(true);
  });

  it("오타 태그가 없고 id가 겹치지 않는다", () => {
    expect(HYEJIN_ART.flatMap(unknownTags)).toEqual([]);
    expect(new Set(HYEJIN_ART.map((i) => i.id)).size).toBe(HYEJIN_ART.length);
  });

  it("전신 풀과 얼굴 이벤트 태그가 하나도 비지 않는다", () => {
    for (const pool of FULL_BODY_POOLS) {
      expect(HYEJIN_ART.some((i) => i.kind === "full" && i.tags.includes(pool)), pool).toBe(true);
    }
    for (const tag of [...FACE_EVENT_TAGS, DEFAULT_FACE_TAG]) {
      expect(HYEJIN_ART.some((i) => i.kind === "face" && i.tags.includes(tag)), tag).toBe(true);
    }
  });

  it("시드 SQL과 같은 내용이다", () => {
    for (const img of HYEJIN_ART) {
      expect(SEED).toContain(`('${img.id}', 'hyejin', '${img.kind}', '{${img.tags.join(",")}}', '${img.path}'`);
    }
  });
});
