import { describe, expect, it } from "vitest";
import { makeState } from "@/game/__tests__/helpers";
import { buildMap, parsePlaceRow, sortPlaces } from "../places";
import type { Place } from "../types";

const place = (id: string, order: number): Place => ({
  id,
  order,
  name: id,
  date: null,
  image: null,
  photos: [],
  episodes: { 1: "", 2: "", 3: "" },
});

describe("맵", () => {
  const places = [place("c", 30), place("a", 10), place("b", 20)];

  it("order 순으로 정렬한다", () => {
    expect(sortPlaces(places).map((p) => p.id)).toEqual(["a", "b", "c"]);
  });

  it("레벨만큼 order 순으로 해금, 나머지는 가린다", () => {
    const map = buildMap(places, makeState({ hyejin: { level: 2 }, bestStars: { b: 3 } }));
    expect(map).toEqual([
      { unlocked: true, place: places[1], bestStars: null },
      { unlocked: true, place: places[2], bestStars: 3 },
      { unlocked: false, order: 30 },
    ]);
  });

  it("레벨 1이면 첫 장소만 열려 있다", () => {
    const map = buildMap(places, makeState());
    expect(map.filter((s) => s.unlocked)).toHaveLength(1);
  });
});

describe("DB 행 읽기", () => {
  it("기획서 형식 그대로", () => {
    const row = {
      id: "place-001",
      order: 1,
      name: "장소 이름",
      date: "2026-03-29",
      image: "placeholder.png",
      episodes: { "1": "별 1개", "2": "별 2개", "3": "별 3개" },
    };
    expect(parsePlaceRow(row)).toEqual({ ...row, photos: ["placeholder.png"], episodes: { 1: "별 1개", 2: "별 2개", 3: "별 3개" } });
  });

  it("추억 사진: 대표 사진이 맨 앞, 빈 값·중복은 뺀다", () => {
    const row = { id: "x", order: 1, image: "a.jpg", photos: ["b.jpg", "", "a.jpg", 3, "c.jpg"] };
    expect(parsePlaceRow(row)?.photos).toEqual(["a.jpg", "b.jpg", "c.jpg"]);
  });

  it("빠진 값은 채우고, id·order가 없으면 건너뛴다", () => {
    expect(parsePlaceRow({ id: "x", order: 2, episodes: { "3": "!" } })).toEqual({
      id: "x",
      order: 2,
      name: "이름 없는 장소",
      date: null,
      image: null,
      photos: [],
      episodes: { 1: "", 2: "", 3: "!" },
    });
    expect(parsePlaceRow({ order: 1 })).toBeNull();
    expect(parsePlaceRow({ id: "x" })).toBeNull();
  });
});
