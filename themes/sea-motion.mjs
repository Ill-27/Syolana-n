const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

// The Gerstner surface cannot exceed the sum of its vertical amplitudes.
export function waveCrestBound(weather) {
  const storm = clamp(Number(weather.storm) || 0, 0, 1);
  return Math.max(0, Number(weather.wave) || 0) * (1.775 + 3.16 * storm);
}

export function createSeaMotion() {
  let last = null, travel = 0, speed = .8;
  const input = { x: 0, y: 0, z: 0 };
  return {
    step(time, camera, weather) {
      const dt = last === null ? 0 : clamp(time - last, 0, .08);
      last = time;
      const blend = 1 - Math.exp(-dt * 3.0);
      for (const key of ['x', 'y', 'z']) {
        const limit = key === 'y' ? 10 : 60;
        const value = camera ? clamp(Number(camera[key]) || 0, -limit, limit) : 0;
        input[key] += (value - input[key]) * blend;
      }
      speed += ((camera ? 1.8 : .8) - speed) * (1 - Math.exp(-dt * 1.1));
      travel += speed * dt;
      // The fleet follows the sailing route, not the user's dolly movement.
      // Otherwise moving forward also moves every ship away by the same amount.
      const routeZ = -travel;
      const camZ = routeZ - input.z * 32;
      const ceiling = waveCrestBound(weather);
      const elevation = Math.max(0, input.y * 16);
      const eye = [input.x * 30, ceiling + 6.2 + elevation, camZ + 18];
      const target = [eye[0] + Math.tanh(input.x * .12) * 12, eye[1] - 5.3 - elevation * .28, camZ - 130];
      return { eye, target, camZ, routeZ, input: { ...input }, clearance: eye[1] - ceiling };
    },
  };
}

export function hullSection(u) {
  const z = -.56 + u * 1.04;
  const width = .5 * (.025 + .975 * Math.pow(Math.sin(Math.PI * (.012 + u * .80)), .68));
  const top = .31 + .055 * Math.pow(2 * u - 1, 2);
  return { z, width, top };
}

export function shipHullGeometry(rings = 48, sides = 24) {
  const positions = [], normals = [], rows = [];
  const point = (u, a) => {
    const q = hullSection(clamp(u, 0, 1));
    return [-Math.cos(a) * q.width, q.top - .72 * Math.pow(Math.max(0, Math.sin(a)), .80), q.z];
  };
  const normal = (u, a) => {
    const p = point(u, Math.max(0, a - .002)), q = point(u, Math.min(Math.PI, a + .002));
    const r = point(Math.max(0, u - .002), a), s = point(Math.min(1, u + .002), a);
    const t = q.map((v, i) => v - p[i]), z = s.map((v, i) => v - r[i]);
    const n = [t[1] * z[2] - t[2] * z[1], t[2] * z[0] - t[0] * z[2], t[0] * z[1] - t[1] * z[0]];
    const length = Math.hypot(...n) || 1;
    return n.map(v => v / length);
  };
  const vertex = (u, a) => ({ p: point(u, a), n: normal(u, a) });
  const tri = (a, b, c) => {
    for (const v of [a, b, c]) { positions.push(...v.p); normals.push(...v.n); }
  };
  for (let r = 0; r <= rings; r++) rows.push(Array.from({ length: sides + 1 }, (_, j) => vertex(r / rings, j / sides * Math.PI)));
  for (let r = 0; r < rings; r++) for (let j = 0; j < sides; j++) {
    tri(rows[r][j], rows[r][j + 1], rows[r + 1][j]);
    tri(rows[r][j + 1], rows[r + 1][j + 1], rows[r + 1][j]);
  }
  // Filled bow and stern, with outward-facing triangles.
  for (const r of [0, rings]) {
    const center = { p: [0, hullSection(r / rings).top - .18, hullSection(r / rings).z], n: [0, 0, r ? 1 : -1] };
    for (let j = 0; j < sides; j++) {
      const a = { p: rows[r][j].p, n: center.n }, b = { p: rows[r][j + 1].p, n: center.n };
      r ? tri(a, b, center) : tri(b, a, center);
    }
    const left = { p: rows[r][0].p, n: center.n }, right = { p: rows[r][sides].p, n: center.n };
    r ? tri(right, left, center) : tri(left, right, center);
  }
  return { positions: new Float32Array(positions), normals: new Float32Array(normals) };
}

export function shipDeckGeometry(rings = 48, across = 12) {
  const positions = [], normals = [];
  const vertex = (u, v) => {
    const q = hullSection(u);
    return [v * q.width, q.top + .007, q.z];
  };
  for (let r = 0; r < rings; r++) for (let j = 0; j < across; j++) {
    const u = r / rings, next = (r + 1) / rings, v = j / across * 2 - 1, vn = (j + 1) / across * 2 - 1;
    const a = vertex(u, v), b = vertex(u, vn), d = vertex(next, v), e = vertex(next, vn);
    for (const p of [a, d, b, b, d, e]) { positions.push(...p); normals.push(0, 1, 0); }
  }
  return { positions: new Float32Array(positions), normals: new Float32Array(normals) };
}

export function shipRailGeometry() {
  const vertices = [];
  const segment = (a, b) => vertices.push(...a, ...b);
  for (const side of [-1, 1]) {
    let last = null;
    for (let i = 0; i <= 48; i++) {
      const q = hullSection(i / 48), x = side * q.width * 9.4, y = q.top * 5.5 - .12, z = q.z * 22.8;
      const p = [x, y + .56, z];
      if (last) segment(last, p);
      if (i % 3 === 0) segment([x, y, z], p);
      last = p;
    }
  }
  return new Float32Array(vertices);
}
