export function addLabel(scene, x, y, text, size = 18, color = "#f3dada") {
  return scene.add.text(x, y, text, {
    fontFamily: "Courier New",
    fontSize: `${size}px`,
    color,
    lineSpacing: 6,
  });
}

export function addCenteredLabel(
  scene,
  y,
  text,
  size = 22,
  color = "#f3dada"
) {
  const label = addLabel(scene, scene.scale.width / 2, y, text, size, color);
  label.setOrigin(0.5, 0);
  return label;
}
