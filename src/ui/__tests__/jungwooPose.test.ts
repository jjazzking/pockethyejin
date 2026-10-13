import { describe, expect, it } from "vitest";
import { jungwooPoseFor } from "../jungwooPose";

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
