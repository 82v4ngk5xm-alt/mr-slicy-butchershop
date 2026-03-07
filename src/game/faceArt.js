const FACE_TEXTURE_KEY = "distorted-face-mini";

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
