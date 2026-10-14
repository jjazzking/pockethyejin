import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ALBUM, ALBUM_PHOTO_COUNT, albumUsage } from "../album";
import { STORY_EVENTS } from "@/game/seen";
import { CHARACTER_ART } from "../characterArt";
import { EVENT_ART } from "../eventArt";

const ROOT = join(__dirname, "..", "..", "..");
const photos = ALBUM.flatMap((s) => s.photos);

describe("사진첩", () => {
  it("모든 그림 파일이 public 안에 있고, 같은 그림이 두 번 나오지 않는다", () => {
    for (const p of photos) expect(existsSync(join(ROOT, "public", p.path)), p.path).toBe(true);
    expect(new Set(photos.map((p) => p.path)).size).toBe(photos.length);
    expect(ALBUM_PHOTO_COUNT).toBe(photos.length);
  });

  it("게임에 나오는 그림은 전부 사진첩에도 있다", () => {
    const inAlbum = new Set(photos.map((p) => p.path));
    expect(CHARACTER_ART.filter((a) => !inAlbum.has(a.path)).map((a) => a.path)).toEqual([]);
  });

  it("그림이 있는 이벤트는 전부 이벤트 섹션에 있다", () => {
    const events = ALBUM.find((s) => s.id === "events")!.photos.map((p) => p.path);
    expect(events).toEqual(STORY_EVENTS.map((id) => EVENT_ART[id]).filter(Boolean));
  });

  it("모든 그림에 제목과 설명이 있다", () => {
    for (const p of photos) {
      expect(p.title.trim(), p.path).not.toBe("");
      expect(p.caption.trim(), p.path).not.toBe("");
    }
  });

  it("게임 그림은 어디에 나오는지 알려주고, 사진첩 전용 그림은 빈 목록", () => {
    expect(albumUsage("/characters/hyejin/face-balloon.webp")).toEqual(["레벨업"]);
    expect(albumUsage("/characters/hyejin/full-bump-cry.webp")).toEqual(["기분이 안 좋을 때 메인 화면", "냉동실 위기 때 메인 화면"]);
    expect(albumUsage("/characters/jeongwoo/full-laptop.webp")).toEqual(["일 시킨 뒤"]);
    expect(albumUsage("/characters/hyejin/album-side.webp")).toEqual([]);
    // 태그가 그대로 노출되지 않게 모든 태그에 문구가 있다
    for (const a of CHARACTER_ART) for (const u of albumUsage(a.path)) expect(u, a.path).not.toMatch(/^[a-z_0-9]+$/);
  });
});
