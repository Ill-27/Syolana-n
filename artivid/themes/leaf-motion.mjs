const TAU = Math.PI * 2;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

// Each leaf has its own height, descent rate and wind phase. A screen-space
// fallback uses the same independent cadence without a central spawn point.
export function createFallingLeafField(count, random) {
  return Array.from({ length: count }, (_, index) => {
    const layer = index % 5;
    return {
      layer,
      offset: random(),
      speed: [.016, .022, .030, .039, .049][layer] * (.84 + random() * .32),
      x: random(),
      sway: .007 + layer * .004 + random() * .006,
      phase: random() * TAU,
      roll: .18 + random() * .62,
      sprite: Math.floor(random() * 4),
      size: [3.1, 5.0, 7.2, 10.4, 15.0][layer] * (.80 + random() * .40),
    };
  });
}

export function sampleLeafFall(leaf, time, width, height) {
  const progress = ((leaf.offset + time * leaf.speed) % 1 + 1) % 1;
  const margin = Math.max(28, leaf.size * 2);
  const wind = Math.sin(time * .42 + leaf.phase) + .32 * Math.sin(time * .19 + leaf.phase * 1.71);
  const span = width + margin * 2;
  const rawX = leaf.x * width + wind * width * leaf.sway;
  const x = ((rawX + margin) % span + span) % span - margin;
  // Y is strictly increasing between resets. Wind only bends the horizontal
  // path; a leaf fades at the ground before returning above the canopy.
  const y = -margin + progress * (height + margin * 2);
  const fade = clamp(progress / .065, 0, 1) * clamp((1 - progress) / .085, 0, 1);
  return { x, y, progress, fade, size: leaf.size };
}
