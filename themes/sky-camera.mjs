// The sky and world use the same view basis and field of view. This keeps
// clouds and the horizon attached to the camera while exploring a scene.
export const SKY_CAMERA_GLSL = `
uniform vec3 uSkyForward,uSkyRight,uSkyUp;
uniform float uSkyTanHalfFov;
vec3 skyRay(vec2 uv,float aspect){
  vec2 screen=(uv*2.0-1.0)*vec2(aspect,1.0)*uSkyTanHalfFov;
  return normalize(uSkyForward+uSkyRight*screen.x+uSkyUp*screen.y);
}
`;

// Overlapping analytic vapour lobes have soft continuous silhouettes; there
// are no grid cells, triangle meshes or hard horizontal layer masks.
export const SMOKE_FIELD_GLSL = `
vec2 smokeField(vec2 p,float time,float storm){
  p+=vec2(sin(p.y*11.0+time*.017),cos(p.x*9.0-time*.012))*.012;
  float density=0.0,shade=0.0;
  for(int i=0;i<18;i++){
    float s=float(i)+1.0;
    vec2 center=vec2(sin(s*2.19)*.96,.14+(sin(s*.91)*.5+.5)*.27);
    center.x+=sin(time*.014+s*.7)*.11;
    center.y+=sin(time*.009+s)*.010;
    vec2 radius=vec2(.085+(sin(s*.47)*.5+.5)*.15,.028+(cos(s*1.31)*.5+.5)*.054);
    radius*=1.0+storm*.48;
    vec2 delta=(p-center)/radius;
    density+=exp(-dot(delta,delta)*1.6)*(.70+.26*sin(s*.73));
    vec2 under=(p-center+vec2(.008,.026))/radius;
    shade+=exp(-dot(under,under)*1.7)*.28;
  }
  return vec2(1.0-exp(-density*(1.45+storm*1.8)),clamp(shade,0.0,1.0));
}
`;

export function skyCameraUniforms(gl, program) {
  return Object.fromEntries(['Forward', 'Right', 'Up', 'TanHalfFov'].map(name => [
    name, gl.getUniformLocation(program, 'uSky' + name),
  ]));
}

export function setSkyCamera(gl, uniforms, view, fov) {
  gl.uniform3f(uniforms.Forward, -view[2], -view[6], -view[10]);
  gl.uniform3f(uniforms.Right, view[0], view[4], view[8]);
  gl.uniform3f(uniforms.Up, view[1], view[5], view[9]);
  gl.uniform1f(uniforms.TanHalfFov, Math.tan(fov / 2));
}
