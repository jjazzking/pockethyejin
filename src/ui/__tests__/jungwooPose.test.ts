import { describe, expect, it } from "vitest";
import { jungwooPoseFor, resolveJungwooPose } from "../jungwooPose";

describe("행동 → 정우 포즈", () => {
  it("정우가 직접 하는 행동은 그 포즈", () => {
    expect(jungwooPoseFor({ type: "work" })).toBe("work");
    expect(jungwooPoseFor({ type: "waiting", quantity: 2 })).toBe("waiting");
    expect(jungwooPoseFor({ type: "convenienceStore" })).toBe("run");
  });

  it("혼자 놀기는 고른 놀이에 따라", () => {
    expect(jungwooPoseFor({ type: "playAlone" }, "dj")).toBe("play_dj");
    expect(jungwooPoseFor({ type: "playAlone" }, "game")).toBe("play_game");
    expect(jungwooPoseFor({ type: "playAlone" })).toBe("play_dj");
  });

  it("혜진 쪽 행동은 평소 모습", () => {
    expect(jungwooPoseFor({ type: "feed", count: 1 })).toBe("idle");
    expect(jungwooPoseFor({ type: "playTogether" })).toBe("idle");
  });
});

describe("혜진 기분에 따른 정우 포즈", () => {
  it("평소 모습일 때 혜진이 30 이하면 눈치 보는 정우", () => {
    expect(resolveJungwooPose("idle", 30)).toBe("apologize");
    expect(resolveJungwooPose("idle", 31)).toBe("idle");
  });

  it("방금 시킨 행동 포즈는 그대로", () => {
    expect(resolveJungwooPose("work", 10)).toBe("work");
    expect(resolveJungwooPose("sulk", 10)).toBe("sulk");
  });
});
