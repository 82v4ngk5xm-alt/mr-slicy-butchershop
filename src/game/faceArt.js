const FACE_TEXTURE_KEY = "distorted-face-mini";
const BLOODY_FACE_TEXTURE_KEY = "distorted-face-bloody-mini";

export function drawDistortedFace(scene, cx, cy, options = {}) {
  const {
    scale = 1,
    jitter = true,
    withWarps = true,
    baseAlpha = 1,
  } = options;

  const g = scene.add.graphics();
  g.setAlpha(baseAlpha);

  const w = 260 * scale;
  const h = 330 * scale;

  g.fillStyle(0xf2e5e5, 1);
  g.fillEllipse(cx, cy, w, h);

  g.fillStyle(0x150b0b, 1);
  g.fillEllipse(cx - 52 * scale, cy - 45 * scale, 54 * scale, 88 * scale);
  g.fillEllipse(cx + 64 * scale, cy - 40 * scale, 50 * scale, 95 * scale);

  g.fillStyle(0xff3a3a, 0.9);
  g.fillEllipse(cx - 52 * scale, cy - 38 * scale, 18 * scale, 26 * scale);
  g.fillEllipse(cx + 64 * scale, cy - 32 * scale, 16 * scale, 24 * scale);

  g.fillStyle(0x1a0000, 1);
  g.fillRoundedRect(cx - 36 * scale, cy + 46 * scale, 106 * scale, 150 * scale, 26 * scale);

  g.fillStyle(0xead9d9, 1);
  for (let i = 0; i < 5; i += 1) {
    g.fillRect(cx - 28 * scale + i * 18 * scale, cy + 78 * scale, 10 * scale, 20 * scale);
  }

  const nodes = [g];

  if (withWarps) {
    const warp1 = scene.add.rectangle(
      cx + 95 * scale,
      cy + 15 * scale,
      220 * scale,
      14 * scale,
      0xff4d4d,
      0.2
    );
    warp1.setRotation(0.25);

    const warp2 = scene.add.rectangle(
      cx - 120 * scale,
      cy + 90 * scale,
      260 * scale,
      12 * scale,
      0xffffff,
      0.15
    );
    warp2.setRotation(-0.18);

    scene.tweens.add({
      targets: [warp1, warp2],
      alpha: { from: 0.05, to: 0.45 },
      duration: 70,
      yoyo: true,
      repeat: -1,
    });

    nodes.push(warp1, warp2);
  }

  if (jitter) {
    scene.tweens.add({
      targets: g,
      x: "+=9",
      yoyo: true,
      duration: 45,
      repeat: -1,
    });
  }

  return nodes;
}

export function drawBloodyDistortedFace(scene, cx, cy, options = {}) {
  const nodes = drawDistortedFace(scene, cx, cy, {
    scale: options.scale ?? 1,
    jitter: options.jitter ?? true,
    withWarps: options.withWarps ?? true,
    baseAlpha: options.baseAlpha ?? 1,
  });

  const scale = options.scale ?? 1;

  const blood = scene.add.graphics();
  blood.fillStyle(0x7a0f14, 0.78);
  blood.fillEllipse(cx - 62 * scale, cy + 22 * scale, 26 * scale, 34 * scale);
  blood.fillEllipse(cx + 72 * scale, cy + 38 * scale, 24 * scale, 32 * scale);
  blood.fillEllipse(cx + 12 * scale, cy + 124 * scale, 42 * scale, 68 * scale);
  blood.fillRect(cx - 5 * scale, cy + 144 * scale, 10 * scale, 34 * scale);

  const drip = scene.add.graphics();
  drip.fillStyle(0x9a141b, 0.62);
  drip.fillRoundedRect(cx + 58 * scale, cy + 48 * scale, 10 * scale, 48 * scale, 4 * scale);
  drip.fillRoundedRect(cx - 66 * scale, cy + 34 * scale, 8 * scale, 40 * scale, 4 * scale);

  nodes.push(blood, drip);
  return nodes;
}

export function ensureFaceTexture(scene) {
  if (scene.textures.exists(FACE_TEXTURE_KEY)) {
    return FACE_TEXTURE_KEY;
  }

  const gfx = scene.make.graphics({ x: 0, y: 0, add: false });
  const size = 96;
  const cx = size / 2;
  const cy = size / 2;
  const scale = 0.34;

  gfx.fillStyle(0x000000, 0);
  gfx.fillRect(0, 0, size, size);

  gfx.fillStyle(0xf2e5e5, 1);
  gfx.fillEllipse(cx, cy, 260 * scale, 330 * scale);

  gfx.fillStyle(0x150b0b, 1);
  gfx.fillEllipse(cx - 52 * scale, cy - 45 * scale, 54 * scale, 88 * scale);
  gfx.fillEllipse(cx + 64 * scale, cy - 40 * scale, 50 * scale, 95 * scale);

  gfx.fillStyle(0xff3a3a, 0.9);
  gfx.fillEllipse(cx - 52 * scale, cy - 38 * scale, 18 * scale, 26 * scale);
  gfx.fillEllipse(cx + 64 * scale, cy - 32 * scale, 16 * scale, 24 * scale);

  gfx.fillStyle(0x1a0000, 1);
  gfx.fillRoundedRect(
    cx - 36 * scale,
    cy + 46 * scale,
    106 * scale,
    150 * scale,
    26 * scale
  );

  gfx.fillStyle(0xead9d9, 1);
  for (let i = 0; i < 5; i += 1) {
    gfx.fillRect(
      cx - 28 * scale + i * 18 * scale,
      cy + 78 * scale,
      10 * scale,
      20 * scale
    );
  }

  gfx.generateTexture(FACE_TEXTURE_KEY, size, size);
  gfx.destroy();

  return FACE_TEXTURE_KEY;
}

export function ensureBloodyFaceTexture(scene) {
  if (scene.textures.exists(BLOODY_FACE_TEXTURE_KEY)) {
    return BLOODY_FACE_TEXTURE_KEY;
  }

  const gfx = scene.make.graphics({ x: 0, y: 0, add: false });
  const size = 96;
  const cx = size / 2;
  const cy = size / 2;
  const scale = 0.34;

  gfx.fillStyle(0x000000, 0);
  gfx.fillRect(0, 0, size, size);

  gfx.fillStyle(0xeedede, 1);
  gfx.fillEllipse(cx, cy, 260 * scale, 330 * scale);

  gfx.fillStyle(0x130809, 1);
  gfx.fillEllipse(cx - 52 * scale, cy - 45 * scale, 54 * scale, 88 * scale);
  gfx.fillEllipse(cx + 64 * scale, cy - 40 * scale, 50 * scale, 95 * scale);

  gfx.fillStyle(0xff3232, 0.95);
  gfx.fillEllipse(cx - 52 * scale, cy - 38 * scale, 18 * scale, 26 * scale);
  gfx.fillEllipse(cx + 64 * scale, cy - 32 * scale, 16 * scale, 24 * scale);

  gfx.fillStyle(0x180000, 1);
  gfx.fillRoundedRect(
    cx - 36 * scale,
    cy + 46 * scale,
    106 * scale,
    150 * scale,
    26 * scale
  );

  gfx.fillStyle(0xead9d9, 1);
  for (let i = 0; i < 5; i += 1) {
    gfx.fillRect(cx - 28 * scale + i * 18 * scale, cy + 78 * scale, 10 * scale, 20 * scale);
  }

  gfx.fillStyle(0x7b0f14, 0.86);
  gfx.fillEllipse(cx - 20 * scale, cy + 10 * scale, 26 * scale, 18 * scale);
  gfx.fillEllipse(cx + 30 * scale, cy + 20 * scale, 22 * scale, 16 * scale);
  gfx.fillEllipse(cx + 8 * scale, cy + 42 * scale, 30 * scale, 22 * scale);
  gfx.fillRect(cx + 26 * scale, cy + 28 * scale, 7 * scale, 24 * scale);
  gfx.fillRect(cx - 38 * scale, cy + 16 * scale, 6 * scale, 18 * scale);

  gfx.generateTexture(BLOODY_FACE_TEXTURE_KEY, size, size);
  gfx.destroy();

  return BLOODY_FACE_TEXTURE_KEY;
}
