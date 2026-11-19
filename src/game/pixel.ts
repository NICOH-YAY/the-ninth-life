// AI-use disclosure: Codex-authored provisional pixel artwork and articulated poses.
// These are native canvas assets, not Higgsfield-generated images.
import Phaser from "phaser";
import palette from "../../assets/pixel/palette.json";

export type Pose = "idle" | "run" | "tell" | "strike" | "recover" | "hurt" | "sit" | "cast";
const POSES: Pose[] = ["idle", "run", "tell", "strike", "recover", "hurt", "sit", "cast"];
// Gameplay sprites are genuinely 48 x 72, snapped to this shared 32-colour palette.
// Generator originals stay untouched in assets/pixel for provenance and later revisions.
const SPRITE_PALETTE = palette.colors.map(hex => [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)] as const);
const SKINS: Record<string, string[]> = {
  kitten: ["#c99b71", "#f2d4a1", "#8d6459"], alley: ["#89909d", "#c5c9cc", "#515c70"],
  sailor: ["#d6c6a6", "#fff0cf", "#968781"], acrobat: ["#c37953", "#f5c887", "#824e48"],
  witch: ["#474357", "#a299aa", "#29263c"], knight: ["#c0bbc5", "#eee5dc", "#78788e"],
  thief: ["#927560", "#dec6a2", "#554f59"], quiet: ["#b4b7c5", "#f2e7da", "#747990"],
  patchwork: ["#bf8c63", "#f4d3a0", "#745361"],
};

function cat(ctx: CanvasRenderingContext2D, key: string, pose: Pose, frame: number): void {
  const boss = key.startsWith("immortal");
  const magic = key.includes("ascended");
  const [fur, light, shade] = (boss ? ["#24283e", "#626b87", "#111828"] : SKINS[key]!) as [string, string, string];
  const wave = [0, 1, 1, 0, -1, -1][frame]!;
  const stride = pose === "run" ? [0, 2, 3, 0, -2, -3][frame]! : 0;
  const crouch = pose === "sit" ? 5 : pose === "tell" ? 2 : 0;
  const lean = pose === "strike" ? -4 : pose === "hurt" ? 3 : pose === "tell" ? 2 : 0;
  const r = (x: number, y: number, w: number, h: number, color: string): void => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const limb = (x: number, y: number, dx: number, dy: number, color: string, thick = 3): void => {
    const n = Math.max(Math.abs(dx), Math.abs(dy));
    for (let i = 0; i <= n; i++) r(x + dx * i / Math.max(1, n), y + dy * i / Math.max(1, n), thick, thick, color);
  };
  // Tail, feet and cloth are independently posed before the torso and head.
  limb(33, 48, 9, -3 + wave * 2, shade, 4); limb(42, 45 + wave * 2, 0, -8, fur);
  r(20 - stride, 50, 6, 9, shade); r(29 + stride, 50, 6, 9, fur);
  r(17 - stride, 57, 9, 3, light); r(29 + stride, 57, 9, 3, light);
  r(19 + lean, 33 + crouch, 17, 20 - crouch, shade); r(20 + lean, 33 + crouch, 13, 17 - crouch, fur);
  r(24 + lean, 36 + crouch, 7, 12 - crouch, light);
  if (boss) {
    for (let y = 34; y < 55; y++) r(17 + lean - (y - 34) / 5, y, 22 + Math.floor((y - 34) / 4), 1, magic ? "#41457a" : "#353054");
    r(19 + lean, 35, 3, 18, "#81708e"); r(34 + lean, 36, 2, 17, "#1c2137");
    for (let i = 0; i < 5; i++) r(14 + i * 6 + lean, 53 + (i % 2 ? wave : 2), 3, 3, "#262640");
  }
  const hy = 18 + crouch + (pose === "idle" ? Math.max(0, wave) : 0);
  r(16 + lean, hy, 22, 16, shade); r(18 + lean, hy - 2, 18, 17, fur);
  r(17 + lean, hy - 8, 5, 10, fur); r(32 + lean, hy - 8, 5, 10, fur);
  r(18 + lean, hy - 5, 2, 5, boss ? "#77729a" : "#df9d9e"); r(33 + lean, hy - 5, 2, 5, "#bd8c99");
  r(18 + lean, hy + 11, 7, 3, light); r(31 + lean, hy + 10, 4, 3, light);
  r(19 + lean, hy + 5, 5, 3, boss ? "#c2b6ed" : "#182331"); r(30 + lean, hy + 5, 4, 3, boss ? "#c2b6ed" : "#182331");
  r(24 + lean, hy + 10, 3, 2, "#d698a5");
  const armY = pose === "tell" || pose === "cast" ? 26 : pose === "strike" ? 39 : 40;
  limb(21 + lean, 36 + crouch, pose === "strike" ? -12 : -5, armY - 36, fur, 4);
  limb(33 + lean, 36 + crouch, 4, pose === "cast" ? -12 : 8 + wave, fur, 4);
  if (boss) {
    r(19 + lean, hy - 6, 16, 3, "#bfa36c");
    for (let i = 0; i < 3; i++) r(19 + lean + i * 6, hy - 11 + i % 2, 3, 6, "#e4c77e");
    r(26 + lean, 36, 3, 4, "#d3ad70");
  }
  // Accessory silhouettes identify lives independently of fur colour.
  if (["alley", "quiet", "patchwork"].includes(key)) {
    const color = key === "quiet" ? "#9bbfc2" : "#db625d";
    r(17 + lean, hy + 16, 22, 4, color); limb(35 + lean, hy + 18, 8 + wave, 4, color);
  }
  if (["sailor", "patchwork"].includes(key)) { r(20 + lean, 37, 16, 13, "#d5ad56"); r(24 + lean, 39, 2, 10, "#f8d885"); r(15 + lean, hy - 1, 25, 3, "#e0b85b"); }
  if (key === "acrobat") { for (let y = 37; y < 51; y += 4) r(20 + lean, y, 16, 2, "#8cc6bd"); r(25 + lean, 35, 4, 4, "#f1cd7a"); }
  if (["witch", "patchwork"].includes(key)) { for (let y = 0; y < 12; y++) r(28 - y / 2 + lean, hy - 14 + y, 3 + y, 1, "#8066ad"); r(13 + lean, hy - 3, 29, 3, "#a18ac3"); }
  if (["knight", "patchwork"].includes(key)) { r(20 + lean, 39, 17, 9, "#829cae"); r(21 + lean, 39, 3, 8, "#d1d9d2"); }
  if (key === "thief") { r(16 + lean, hy + 3, 22, 6, "#222a3c"); r(19 + lean, hy + 5, 4, 2, "#dde4c7"); r(30 + lean, hy + 5, 4, 2, "#dde4c7"); }
  if (key !== "quiet" && !magic) {
    const wx = 14 + lean;
    if (pose === "strike") { limb(wx, 40, -13, 6, "#ada7aa", 2); limb(wx - 13, 46, 8, -5, "#e3e0d2", 2); }
    else { limb(wx, armY - 10, 0, boss ? 30 : 20, "#bba782", 2); limb(wx, armY - 11, -5, 5, "#d2e6df", 3); }
  }
  if (magic) { for (let i = 0; i < 4; i++) r(9 + i * 10, 20 + (i % 2) * 14 + wave * 2, 2, 3, "#8cf2d2"); }
}

export function pixelFrame(key: string, pose: Pose, time: number, move?: string): string {
  const row = move === "reap" ? 2 : move === "throw" ? 3 : move === "nova" ? 4 : 1;
  const attack = pose === "tell" || pose === "strike" || pose === "recover" || pose === "cast";
  return `${key}:${pose}${move && attack ? `-${row}` : ""}:${Math.floor(time * (pose === "run" ? 12 : 8)) % 6}`;
}

/** Install verified Higgsfield frames over the native fallback without changing anchors. */
export function installPixelSheet(scene: Phaser.Scene, source: string, key: string, rowMap: Partial<Record<Pose, number>>, columns = 6, rows = 4, suffix = "", columnMap: Partial<Record<Pose, number[]>> = {}): void {
  if (!scene.textures.exists(source)) return;
  const src = scene.textures.get(source).getSourceImage() as HTMLImageElement;
  const sw = src.width / columns; const sh = src.height / rows;
  for (const pose of POSES) {
    const row = rowMap[pose];
    if (row === undefined) continue;
    for (let frame = 0; frame < 6; frame++) {
      const name = `${key}:${pose}${suffix}:${frame}`;
      if (scene.textures.exists(name)) scene.textures.remove(name);
      const tex = scene.textures.createCanvas(name, 48, 72)!;
      const ctx = tex.getContext(); ctx.imageSmoothingEnabled = false;
      const column = columnMap[pose]?.[frame] ?? (pose === "tell" || pose === "cast" ? Math.min(1, frame) : pose === "strike" ? 3 + frame % 2 : pose === "recover" ? 5 : frame);
      ctx.drawImage(src, column * sw, row * sh, sw, sh, 0, 0, 48, 72);
      const pixels = ctx.getImageData(0, 0, 48, 72);
      for (let p = 0; p < pixels.data.length; p += 4) {
        pixels.data[p + 3] = pixels.data[p + 3]! < 96 ? 0 : 255;
        if (!pixels.data[p + 3]) continue;
        let best = SPRITE_PALETTE[0]!; let distance = Infinity;
        for (const rgb of SPRITE_PALETTE) {
          const d = (pixels.data[p]! - rgb[0]) ** 2 + (pixels.data[p + 1]! - rgb[1]) ** 2 + (pixels.data[p + 2]! - rgb[2]) ** 2;
          if (d < distance) { best = rgb; distance = d; }
        }
        pixels.data[p] = best[0]; pixels.data[p + 1] = best[1]; pixels.data[p + 2] = best[2];
      }
      // Normalize the feet using the central body region, excluding extended blades.
      let foot = 0;
      for (let y = 0; y < 72; y++) for (let x = 14; x < 35; x++) if (pixels.data[(y * 48 + x) * 4 + 3]) foot = y;
      ctx.clearRect(0, 0, 48, 72);
      ctx.putImageData(pixels, 0, Math.max(0, 71 - foot)); tex.refresh();
    }
  }
  if (suffix) return;
  const idle = scene.textures.get(`${key}:idle:0`).getSourceImage() as HTMLCanvasElement;
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const still = scene.textures.createCanvas(key, 48, 72)!;
  still.getContext().drawImage(idle, 0, 0); still.refresh();
}

export function installChallengers(scene: Phaser.Scene): void {
  Object.keys(SKINS).forEach((key, row) => {
    const rowMap = Object.fromEntries(POSES.map(pose => [pose, row]));
    const columns: Partial<Record<Pose, number[]>> = {
      idle: [0, 0, 5, 5, 0, 0], run: [0, 2, 2, 0, 2, 2], tell: [1, 1, 1, 1, 2, 2],
      strike: [2, 3, 3, 4, 4, 5], recover: [4, 4, 5, 5, 5, 5], hurt: [4, 4, 4, 4, 4, 4], sit: [4, 4, 4, 4, 4, 4],
    };
    // The alley attack cell 3 inherited the kitten's twig; retain its dagger identity.
    if (key === "alley") columns.strike = [2, 4, 4, 4, 4, 5];
    if (key === "quiet") columns.sit = [0, 1, 2, 3, 4, 5];
    installPixelSheet(scene, "hf-challengers", key, rowMap, 6, 9, "", columns);
    installPixelSheet(scene, "hf-walk", key, { run: row }, 6, 9, "", { run: [0, 1, 2, 3, 4, 5] });
  });
}

/** Each generated attack row has authored anticipation / contact / follow-through. */
export function installBossSheet(scene: Phaser.Scene, source: string, key: string): void {
  const sequence = { tell: [0, 0, 1, 1, 2, 2], cast: [0, 0, 1, 1, 2, 2], strike: [3, 3, 4, 4, 4, 4], recover: [4, 4, 5, 5, 5, 5] };
  installPixelSheet(scene, source, key, { idle: 0, tell: 1, strike: 1, recover: 1, cast: 1, hurt: 0, sit: 0 }, 6, 4, "", sequence);
  for (let row = 1; row <= 4; row++) {
    const sourceRow = key.includes("ascended") ? (row === 1 ? 1 : row === 2 ? 1 : row === 3 ? 2 : 3) : row === 4 ? 1 : row;
    installPixelSheet(scene, source, key, { tell: sourceRow, strike: sourceRow, recover: sourceRow, cast: sourceRow }, 6, 4, `-${row}`, sequence);
  }
}

export function createPixelArt(scene: Phaser.Scene): void {
  for (const key of [...Object.keys(SKINS), "immortal-base", "immortal-ascended"]) {
    for (const pose of POSES) for (let frame = 0; frame < 6; frame++) {
      const tex = scene.textures.createCanvas(`${key}:${pose}:${frame}`, 56, 64)!;
      cat(tex.getContext(), key, pose, frame); tex.refresh();
    }
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const tex = scene.textures.createCanvas(key, 56, 64)!; cat(tex.getContext(), key, "idle", 0); tex.refresh();
  }
  for (const key of ["bg-night", "bg-dawn", "key-art"]) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const tex = scene.textures.createCanvas(key, 320, 180)!;
    const c = tex.getContext(); const dawn = key === "bg-dawn";
    const rect = (x: number, y: number, w: number, h: number, color: string): void => { c.fillStyle = color; c.fillRect(x, y, w, h); };
    rect(0, 0, 320, 180, "#10192b");
    for (let i = 0; i < 12; i++) rect(45 + i * 2, 9 + i * 3, 235 - i * 4, 155 - i * 3, i % 2 ? "#1b2b40" : "#21344a");
    for (const x of [55, 146, 237]) {
      rect(x, 23, 29, 105, "#41616a"); rect(x + 3, 26, 23, 101, dawn ? "#ae8d76" : "#294d60");
      rect(x + 6, 31, 17, 96, dawn ? "#d9b18a" : "#3d7b83");
      rect(x + 14, 25, 2, 105, "#1c2d42"); rect(x, 61, 30, 3, "#1c2d42");
      for (let j = 0; j < 12; j++) rect(x - j, 94 + j * 4, 30 + j * 3, 4, dawn ? "#77736b" : "#2c4858");
    }
    // Moon, a vacant high throne, distant roots, broken pillars.
    rect(155, 35, 12, 12, dawn ? "#f4d2a3" : "#c4d7ca"); rect(152, 38, 18, 6, dawn ? "#f4d2a3" : "#c4d7ca");
    rect(250, 81, 37, 54, "#111c30"); rect(254, 85, 29, 47, "#35435a"); rect(258, 89, 21, 39, "#1c2b40");
    rect(247, 120, 43, 5, "#7b7883"); rect(248, 125, 6, 16, "#2d3b51"); rect(283, 125, 6, 16, "#2d3b51");
    for (const x of [12, 105, 211, 301]) { rect(x, 0, 12, 148, "#101a2c"); rect(x - 3, 16, 18, 5, "#354257"); rect(x - 4, 140, 20, 7, "#3a4758"); rect(x + 2, 22, 2, 114, "#314357"); }
    rect(0, 150, 320, 30, "#141e2c");
    for (let row = 0; row < 5; row++) for (let col = 0; col < 12; col++) {
      const x = col * 31 - (row % 2) * 14; const y = 150 + row * 7;
      rect(x, y, 29, 6, (row + col) % 3 ? "#283749" : "#344354"); rect(x + 2, y, 25, 1, "#4a5965");
    }
    for (let i = 0; i < 40; i++) { const x = (i * 73 + 17) % 320; const y = (i * 29 + 51) % 170; rect(x, y, 1, 1, i % 3 ? "#537578" : "#a0c6b8"); }
    for (let i = 0; i < 9; i++) { rect(i * 3, i * 13, 9, 29, "#080f20"); rect(311 - i * 2, i * 16, 9, 27, "#080f20"); }
    tex.refresh();
  }
}
