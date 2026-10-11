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
float vapourHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float vapourNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(vapourHash(i),vapourHash(i+vec3(1,0,0)),f.x),mix(vapourHash(i+vec3(0,1,0)),vapourHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(vapourHash(i+vec3(0,0,1)),vapourHash(i+vec3(1,0,1)),f.x),mix(vapourHash(i+vec3(0,1,1)),vapourHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float vapourFbm(vec3 p){float n=.54*vapourNoise(p);p=p*2.03+vec3(2.7,8.1,4.3);n+=.27*vapourNoise(p);p=p*2.01+vec3(9.3,1.7,6.5);return n+.14*vapourNoise(p);}
vec2 smokeField(vec2 p,float time,float storm){
  vec3 samplePoint=vec3(p*vec2(7.8,18.0)+vec2(time*.022,0),time*.007);
  float grain=vapourFbm(samplePoint),detail=vapourNoise(samplePoint*3.8+grain*2.0);
  p+=vec2(grain-.45,detail-.5)*.038;
  float density=0.0,shade=0.0;
  for(int i=0;i<18;i++){
    float s=float(i)+1.0;
    vec2 center=vec2(sin(s*2.19)*3.08,.14+(sin(s*.91)*.5+.5)*.27);
    center.x+=sin(time*.014+s*.7)*.11;
    center.y+=sin(time*.009+s)*.010;
    vec2 radius=vec2(.18+(sin(s*.47)*.5+.5)*.38,.032+(cos(s*1.31)*.5+.5)*.066);
    radius*=1.0+storm*.48;
    vec2 delta=(p-center)/radius;
    density+=exp(-dot(delta,delta)*1.6)*(.70+.26*sin(s*.73));
    vec2 under=(p-center+vec2(.008,.026))/radius;
    shade+=exp(-dot(under,under)*1.7)*.28;
  }
  float erosion=smoothstep(.20,.70,grain+detail*.17);
  float volume=density*(.40+erosion*.74);
  float lighting=clamp(shade*.56+(.60-grain)*.65+detail*.09,0.0,1.0);
  return vec2(1.0-exp(-volume*(1.45+storm*1.8)),lighting);
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
