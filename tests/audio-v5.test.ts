// AI-use disclosure: Codex-authored regressions for the scene and per-visitor soundtrack contract.
import {describe,it,expect} from "vitest";
import {TRACKS,LIFE_WEAPON,SOUND_FILES} from "../src/game/soundtrack";
import type {LifeId} from "../src/core/types";
import manifest from "../assets/audio-v5/manifest.json";

describe("differentiated score and material Foley",()=>{
  const lives:LifeId[]=["kitten","alley","sailor","acrobat","witch","knight","thief","quiet","patchwork"];
  it("assigns all nine returning forms genuinely different compositions and files",()=>{
    expect(new Set(lives.map(life=>TRACKS[life].title)).size).toBe(9);
    expect(new Set(lives.map(life=>TRACKS[life].file)).size).toBe(9);
    expect(lives.every(life=>TRACKS[life].gain>0&&TRACKS[life].gain<0.7)).toBe(true);
  });
  it("never repeats a combat theme for the menu, years or final aftermath",()=>{
    expect(new Set(Object.values(TRACKS).map(track=>track.file)).size).toBe(12);
    expect(new Set(manifest.tracks.map(track=>track.sourceSha256)).size).toBe(12);
    expect(new Set(manifest.tracks.map(track=>track.runtimeSha256)).size).toBe(12);
    expect(TRACKS.finale.loop).toBe(false);
    expect(TRACKS.menu.title).not.toBe(TRACKS.years.title);
  });
  it("maps character accessories to material-specific sounds",()=>{
    expect(LIFE_WEAPON.kitten).toBe("wood");
    expect(LIFE_WEAPON.sailor).toBe("chain");
    expect(LIFE_WEAPON.quiet).toBe("ice");
    expect(SOUND_FILES).toEqual(expect.arrayContaining(["sword-swing","metal-guard","wood","ice","stab","flesh","footstep-1","footstep-2"]));
  });
});
