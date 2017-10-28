(function(TinyGL){
  'use strict';

  let defaultVertexSource = `
    precision highp float;
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;

  let defaultFragmentSource = `
    void main() {
    }
  `;

  class Pass {
    constructor({context, vertex=defaultVertexSource, fragment=defaultFragmentSource, framebuffer=context.framebuffer}) {
      this.context = context;
      this.vertex = vertex;
      this.fragment = fragment;
      this.framebuffer = framebuffer;
      this.uniforms = {};
      this._uniforms = new TinyGL.Uniforms({context, uniforms: this.uniforms});
      this.geometry = TinyGL.Geometry.quad({context});

      this.compile();
    }

    compile({vertex=this.vertex, fragment=this.fragment}={}) {
      //TODO Cleanup old program
      this.vertex = vertex;
      this.fragment = fragment;
      let vs, fs;
      try {
        vs = new TinyGL.VertexShader({context: this.context, source: this.vertex});
        fs = new TinyGL.FragmentShader({context: this.context, source: this.fragment});
        this.program = new TinyGL.Program({context: this.context, vertex: vs, fragment: fs});
      } catch(e) {
        throw e;
      } finally {
        //TODO Cleanup vs and fs
      }
    }

    draw({state=TinyGL.State.empty}={}) {
      this.program.use();
      this.framebuffer.bind();
      this.context.clear();
      this._uniforms.bind({program: this.program, state: state});
      this.geometry.draw(this.program);
    }
  }

  //TODO Rename to Engine or something
  class Shadertoy {
    constructor({context}) {
      this.context = context;
      this.passes = [];

      this.loop();
    }

    add(pass) {
      this.passes.push(pass);
    }

    loop() {
      let inner = ()=>{
        this.draw();
        requestAnimationFrame(inner);
      };
      inner();
    }

    draw() {
      for(let pass of this.passes) {
        if(pass.update)
          pass.update();
        if(pass.draw)
          pass.draw();
      }
    }
  }

  TinyGL.Shadertoy = TinyGL.Shadertoy || {};
  Object.assign(TinyGL.Shadertoy, {Pass, Shadertoy});
})(window.TinyGL = window.TinyGL || {});
