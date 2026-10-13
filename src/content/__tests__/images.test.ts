import { describe, expect, it } from "vitest";
import {
  faceTagForEvent,
  fullBodyPoolOrder,
  parseCharacterImageRow,
  pickFace,
  pickFullBody,
  pickJungwooFace,
  pickJungwooPose,
  unknownTags,
} from "../images";
import { FACE_EVENT_TAGS, type CharacterImage } from "../types";

let n = 0;
function img(kind: "full" | "face", tags: string[], character: "hyejin" | "jeongwoo" = "hyejin"): CharacterImage {
  n += 1;
  return { id: `img-${n}`, character, kind, tags, path: `/p/${n}.png`, description: null };
}

/** 정해진 값을 차례로 돌려주는 난수 (끝나면 처음부터) */
const cycle = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

const normal = [img("full", ["normal"]), img("full", ["normal"]), img("full", ["normal"])];
const sad = [img("full", ["sad"]), img("full", ["sad"])];
const danger = [img("full", ["danger"])];
const ALL = [...normal, ...sad, ...danger];

describe("전신: 행복도 구간별 풀", () => {
  it("30 초과는 normal, 30 이하는 sad, 20 이하는 danger", () => {
    expect(fullBodyPoolOrder(100)[0]).toBe("normal");
    expect(fullBodyPoolOrder(31)[0]).toBe("normal");
    expect(fullBodyPoolOrder(30)[0]).toBe("sad");
    expect(fullBodyPoolOrder(21)[0]).toBe("sad");
    expect(fullBodyPoolOrder(20)[0]).toBe("danger");
    expect(fullBodyPoolOrder(0)[0]).toBe("danger");
  });

  it.each([
    [100, normal],
    [31, normal],
    [30, sad],
    [21, sad],
    [20, danger],
    [0, danger],
  ])("행복도 %i → 해당 풀에서만 고른다", (happiness, pool) => {
    for (const r of [0, 0.34, 0.67, 0.99]) {
      expect(pool).toContainEqual(pickFullBody(ALL, happiness, null, () => r));
    }
  });

  it("danger 풀이 비었으면 sad 풀을 쓴다", () => {
    const picked = pickFullBody([...normal, ...sad], 10, null, () => 0.5);
    expect(sad).toContainEqual(picked);
  });

  it("sad 풀도 비었으면 normal로 대체 (게임이 멈추지 않게)", () => {
    expect(normal).toContainEqual(pickFullBody(normal, 10, null, () => 0));
    expect(normal).toContainEqual(pickFullBody(normal, 25, null, () => 0));
  });

  it("그림이 하나도 없으면 null", () => {
    expect(pickFullBody([], 100, null, () => 0)).toBeNull();
    expect(pickFullBody([img("face", ["normal"])], 100, null, () => 0)).toBeNull();
  });

  it("혜진 그림만 쓴다 (정우 그림 제외)", () => {
    const jeongwoo = img("full", ["normal"], "jeongwoo");
    expect(pickFullBody([jeongwoo], 100, null, () => 0)).toBeNull();
  });
});

describe("전신: 연속 중복 방지", () => {
  it("직전 그림은 다시 고르지 않는다", () => {
    for (const r of [0, 0.2, 0.5, 0.8, 0.99]) {
      const picked = pickFullBody(ALL, 100, normal[0].id, () => r);
      expect(picked?.id).not.toBe(normal[0].id);
      expect(normal).toContainEqual(picked);
    }
  });

  it("여러 번 연속 호출해도 같은 그림이 이어지지 않는다", () => {
    const rng = cycle(0, 0, 0.5, 0.9, 0.1);
    let prev: string | null = null;
    for (let i = 0; i < 20; i++) {
      const picked: CharacterImage = pickFullBody(ALL, 100, prev, rng)!;
      expect(picked.id).not.toBe(prev);
      prev = picked.id;
    }
  });

  it("풀에 한 장뿐이면 같은 그림이 이어져도 된다", () => {
    expect(pickFullBody(danger, 0, danger[0].id, () => 0)).toEqual(danger[0]);
  });

  it("직전 그림이 다른 풀 것이면 제외할 것이 없다", () => {
    expect(pickFullBody(normal, 100, sad[0].id, () => 0)).toEqual(normal[0]);
  });
});

describe("얼굴: 이벤트 태그", () => {
  const def = img("face", ["default"]);
  const eat = [img("face", ["eat_mochi"]), img("face", ["eat_mochi", "level_up"])];
  const faces = [def, ...eat, img("full", ["level_up"])];

  it("그 태그가 붙은 얼굴 중에서 고른다", () => {
    expect(eat).toContainEqual(pickFace(faces, "eat_mochi", () => 0));
    expect(eat).toContainEqual(pickFace(faces, "eat_mochi", () => 0.99));
    expect(pickFace(faces, "level_up", () => 0)).toEqual(eat[1]);
  });

  it("그 이벤트 그림이 없으면 default", () => {
    expect(pickFace(faces, "date_3star", () => 0)).toEqual(def);
  });

  it("default도 없으면 null", () => {
    expect(pickFace(eat, "warning", () => 0)).toBeNull();
    expect(pickFace([], "warning", () => 0)).toBeNull();
  });

  it("모든 이벤트 태그에서 default로 대체된다", () => {
    for (const tag of FACE_EVENT_TAGS) expect(pickFace([def], tag, () => 0)).toEqual(def);
  });
});

describe("게임 이벤트 → 얼굴 태그", () => {
  it("대응표", () => {
    expect(faceTagForEvent({ type: "fed", count: 1 })).toBe("eat_mochi");
    expect(faceTagForEvent({ type: "leveledUp", level: 2, cost: 10 })).toBe("level_up");
    expect(faceTagForEvent({ type: "warningStarted" })).toBe("warning");
    expect(faceTagForEvent({ type: "countdownStarted", turnsLeft: 3 })).toBe("countdown");
    expect(faceTagForEvent({ type: "jungwooBlocked" })).toBe("jeongwoo_block");
    expect(faceTagForEvent({ type: "halfEaten", eaten: 1, recovered: 10 })).toBe("eat_half");
    expect(faceTagForEvent({ type: "bulldakCraving", date: "2026-10-12" })).toBe("buldak_craving");
    expect(faceTagForEvent({ type: "bulldakResolved" })).toBe("buldak_eat");
    expect(faceTagForEvent({ type: "playedTogether" })).toBe("play_together");
    for (const stars of [1, 2, 3] as const) {
      expect(faceTagForEvent({ type: "dated", placeId: "p", stars, newBest: true, firstVisit: true })).toBe(
        `date_${stars}star`,
      );
    }
    expect(faceTagForEvent({ type: "newPlacesAdded", count: 1, levelCapRaised: false })).toBe("new_place");
    expect(faceTagForEvent({ type: "worked", income: 1 })).toBeNull();
  });
});

describe("DB 행 읽기", () => {
  it("형식이 틀린 행은 건너뛴다", () => {
    const ok = { id: "a", character: "hyejin", kind: "full", tags: ["normal", " sad "], path: "x.png", description: null };
    expect(parseCharacterImageRow(ok)).toEqual({ ...ok, tags: ["normal", "sad"] });
    expect(parseCharacterImageRow({ ...ok, kind: "body" })).toBeNull();
    expect(parseCharacterImageRow({ ...ok, character: "yeppi" })).toBeNull();
    expect(parseCharacterImageRow({ ...ok, path: "" })).toBeNull();
    expect(parseCharacterImageRow({ ...ok, tags: null })?.tags).toEqual([]);
  });

  it("오타 태그를 찾아준다", () => {
    expect(unknownTags(img("face", ["default", "eat_moch"]))).toEqual(["eat_moch"]);
  });
});

describe("정우 포즈", () => {
  const idle = img("full", ["idle"], "jeongwoo");
  const work = img("full", ["work"], "jeongwoo");
  const sulk = img("full", ["sulk"], "jeongwoo");
  const games = [img("full", ["play_game"], "jeongwoo"), img("full", ["play_game"], "jeongwoo")];
  const all = [idle, work, sulk, ...games];

  it("방금 시킨 행동의 포즈를 고른다", () => {
    expect(pickJungwooPose(all, "work", false, null, () => 0)).toBe(work);
  });

  it("삐져 있으면 무조건 sulk", () => {
    expect(pickJungwooPose(all, "work", true, null, () => 0)).toBe(sulk);
  });

  it("그 포즈 그림이 없으면 idle, 아무것도 없으면 null", () => {
    expect(pickJungwooPose(all, "run", false, null, () => 0)).toBe(idle);
    expect(pickJungwooPose([], "run", false, null, () => 0)).toBeNull();
  });

  it("같은 포즈가 여러 장이면 직전 그림을 피한다", () => {
    expect(pickJungwooPose(all, "play_game", false, games[0].id, () => 0)).toBe(games[1]);
  });

  it("혜진 그림은 쓰지 않는다", () => {
    expect(pickJungwooPose([img("full", ["idle"])], "idle", false, null, () => 0)).toBeNull();
  });
});

describe("정우 얼굴", () => {
  it("태그에 맞는 정우 얼굴, 없으면 null", () => {
    const happy = img("face", ["happy"], "jeongwoo");
    expect(pickJungwooFace([happy, img("face", ["happy"])], "happy", () => 0)).toBe(happy);
    expect(pickJungwooFace([happy], "sulk", () => 0)).toBeNull();
  });

  it("정우 태그는 정우 그림에서만 알려진 태그다", () => {
    expect(unknownTags(img("full", ["work", "normal"], "jeongwoo"))).toEqual(["normal"]);
    expect(unknownTags(img("full", ["work"]))).toEqual(["work"]);
  });
});
