const DELIVERY_GUY_TEXTURE_KEY = "delivery-guy-mini";

export function ensureDeliveryGuyTexture(scene) {
  if (scene.textures.exists(DELIVERY_GUY_TEXTURE_KEY)) {
    return DELIVERY_GUY_TEXTURE_KEY;
  }

  const size = 64;
  const gfx = scene.make.graphics({ x: 0, y: 0, add: false });

  gfx.fillStyle(0x000000, 0);
  gfx.fillRect(0, 0, size, size);

  // hat
  gfx.fillStyle(0x2f3560, 1);
  gfx.fillRect(22, 8, 20, 6);
  gfx.fillRect(18, 14, 28, 4);

  // head
  gfx.fillStyle(0xe7c19e, 1);
  gfx.fillRect(22, 18, 20, 14);

  // beard shadow / facial detail
  gfx.fillStyle(0x8a5a4a, 1);
  gfx.fillRect(24, 27, 16, 4);

  // eyes
  gfx.fillStyle(0x1d1111, 1);
  gfx.fillRect(26, 22, 2, 2);
  gfx.fillRect(36, 22, 2, 2);

  // jacket
  gfx.fillStyle(0x4a7ab7, 1);
  gfx.fillRect(19, 33, 26, 18);

  // shirt stripe
  gfx.fillStyle(0xcfe8ff, 1);
  gfx.fillRect(30, 33, 4, 18);

  // arms
  gfx.fillStyle(0x3f6697, 1);
  gfx.fillRect(15, 34, 4, 12);
  gfx.fillRect(45, 34, 4, 12);

  // legs
  gfx.fillStyle(0x2b2b36, 1);
  gfx.fillRect(22, 51, 8, 9);
  gfx.fillRect(34, 51, 8, 9);

  // shoes
  gfx.fillStyle(0x141419, 1);
  gfx.fillRect(21, 60, 10, 3);
  gfx.fillRect(33, 60, 10, 3);

  // delivery satchel
  gfx.fillStyle(0x8f5c2d, 1);
  gfx.fillRect(43, 38, 8, 9);
  gfx.fillStyle(0xb97a3e, 1);
  gfx.fillRect(45, 40, 4, 3);

  gfx.generateTexture(DELIVERY_GUY_TEXTURE_KEY, size, size);
  gfx.destroy();

  return DELIVERY_GUY_TEXTURE_KEY;
}
