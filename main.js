'use strict';

let context = new TinyGL.Context({width:320, height: 240});
document.body.appendChild(context.canvas);

let fss = `
precision highp float;
uniform sampler2D tex;
void main() {
  vec2 coord = gl_FragCoord.xy/vec2(640.0,480.0);
  vec4 t = texture2D(tex, coord);
  float c = (t.x + t.y + t.z) / 3.0;
  gl_FragColor = vec4(c, c, c, 1.0);
}
`;

let fss2 = `
precision highp float;
uniform sampler2D tex;
void main() {
  vec2 coord = gl_FragCoord.xy/vec2(320.0,240.0);
  vec4 t = texture2D(tex, coord);
  gl_FragColor = vec4(t.xyz, 1.0);
}
`;

let c = new TinyGL.Media.Camera({context});
let fbA = new TinyGL.Framebuffer({context, width: 640, height: 480});

let pass1 = new TinyGL.Shadertoy.Pass({context, framebuffer: fbA, fragment: fss});
pass1.uniforms.tex = c.texture;

let pass2 = new TinyGL.Shadertoy.Pass({context, fragment: fss2});
pass2.uniforms.tex = fbA.texture;

let shadertoy = new TinyGL.Shadertoy.Shadertoy({context});
shadertoy.add(c);
shadertoy.add(pass1);
shadertoy.add(pass2);
