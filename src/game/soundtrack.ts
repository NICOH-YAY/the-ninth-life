// AI-use disclosure: Codex-authored mapping of licensed human-composed score excerpts.
import type { LifeId } from "../core/types";
export type MusicCue = "menu" | "years" | "finale" | LifeId;
export const TRACKS: Record<MusicCue, { title: string; file: string; gain: number; loop: boolean }> = {
  menu: {title:"Incantation",file:"menu",gain:0.40,loop:true},
  years: {title:"Hiraeth",file:"years",gain:0.38,loop:true},
  kitten: {title:"Call To Adventure",file:"kitten",gain:0.43,loop:true},
  alley: {title:"Juggernaut",file:"alley",gain:0.48,loop:true},
  sailor: {title:"Legionnaire (2022 Remaster)",file:"sailor",gain:0.46,loop:true},
  acrobat: {title:"Race The Sun",file:"acrobat",gain:0.46,loop:true},
  witch: {title:"The Summoning",file:"witch",gain:0.47,loop:true},
  knight: {title:"Goliath",file:"knight",gain:0.48,loop:true},
  thief: {title:"Honour Among Thieves",file:"thief",gain:0.43,loop:true},
  quiet: {title:"Snowfall",file:"quiet",gain:0.45,loop:true},
  patchwork: {title:"Vanguard",file:"patchwork",gain:0.50,loop:true},
  finale: {title:"Helios",file:"finale",gain:0.46,loop:false},
};
export const MUSIC_CREDIT = "Music by Scott Buckley – released under CC-BY 4.0. www.scottbuckley.com.au. Game excerpts trimmed, normalized and compressed.";
export const SOUND_FILES = ["sword-swing","sword-light","sword-draw","metal-guard","metal-hit","chain","wood","ice","flesh","stab","dash","dash-magic","footstep-1","footstep-2","nova"] as const;
export type SoundId = typeof SOUND_FILES[number];
export type WeaponSound = "sword" | "chain" | "wood" | "ice" | "magic";
export const LIFE_WEAPON: Record<LifeId, WeaponSound> = {
  kitten:"wood",alley:"sword",sailor:"chain",acrobat:"sword",witch:"magic",knight:"chain",thief:"sword",quiet:"ice",patchwork:"sword",
};
