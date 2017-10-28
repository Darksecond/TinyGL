(function(TinyGL){
  'use strict';
  class DefaultFramebuffer {
    get gl() { return this.context.gl; }
    constructor({context}) {
      this.context = context;
    }
    
    bind({viewport=true}={}) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
      if(viewport)
        this.gl.viewport(0, 0, this.context.width, this.context.height);
    }
  }

  class Context {
    constructor({canvas=document.createElement('canvas'), width=320, height=240}={}) {
      this.canvas = canvas;
      this.gl = this.canvas.getContext('webgl');
      if(!this.gl) throw new Error('Could not getContext');

      this.resize(width, height);
      this.framebuffer = new DefaultFramebuffer({context: this});

      this.framebuffer.bind();
    }

    resize(width, height) {
      //TODO Add and handle pixelRatio
      this.width = width;
      this.height = height;
      this.canvas.width = width;
      this.canvas.height = height;
    }

    clear({red=0, green=0, blue=0, alpha=1}={}) {
      this.gl.clearColor(red, green, blue, alpha);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
  }

  class Texture {
    get gl() { return this.context.gl; }
    constructor({context, width=context.width, height=context.height, data=null}) {
      this.context = context;

      this.create({width, height, data});
    }

    create({width, height, data}) {
      //TODO Cleanup old texture first
      this.width = width;
      this.height = height;
      this.texture = this.gl.createTexture();
      this.bind();

      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true); //Flip camera


      //TODO Allow FLOAT Textures
      //     With OES_texture_float extension
      //TODO Allow different modes than RGBA
      //     For example DEPTH_COMPONENT or ALPHA
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.width,
          this.height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);
    }

    bind(unit=0) {
      this.gl.activeTexture(this.gl.TEXTURE0 + unit);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    }

    //TODO Redo into better update/upload method
    updateVideo(video) {
      this.width = video.videoWidth;
      this.height = video.videoHeight;
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, video);
    }
  }

  class Framebuffer {
    get gl() { return this.context.gl; }
    constructor({context, width=context.width, height=context.height}) {
      this.context = context;

      this.create({width, height});
    }

    create({width, height}) {
      //TODO Cleanup old texture and framebuffer first
      this.texture = new Texture({context: this.context, width, height});

      this.framebuffer = this.gl.createFramebuffer();
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);

      this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER,
          this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D,
          this.texture.texture, 0);

      //TODO Depth component
      this.context.framebuffer.bind({viewport: false});
    }

    bind({viewport=true}={}) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffer);
      if(viewport)
        this.gl.viewport(0, 0, this.texture.width, this.texture.height);
    }
  }

  class Buffer {
    get gl() { return this.context.gl; }
    constructor({context, data, type=Buffer.DATA}) {
      this.context = context;
      
      this.create({data, type});
    }

    create({data, elements, type}) {
      //TODO Cleanup old buffer first
      this.type = type;
      this.buffer = this.gl.createBuffer();
      this.gl.bindBuffer(this.glType, this.buffer);
      this.gl.bufferData(this.glType, data, this.gl.STATIC_DRAW);
    }

    get glType() {
      switch(this.type) {
        case Buffer.DATA: return this.gl.ARRAY_BUFFER;
        case Buffer.INDEX: return this.gl.ELEMENT_ARRAY_BUFFER;
        default: throw new Error('No such type');
      }
    }
  }
  Buffer.DATA = Symbol('DATA');
  Buffer.INDEX = Symbol('INDEX');

  class Shader {
    get gl() { return this.context.gl; }
    constructor({context, source, type}) {
      this.type = type;
      this.context = context;

      this.create({source});
    }

    create({source}) {
      //TODO Cleanup old shader first
      this.shader = this.gl.createShader(this.glType);
      this.gl.shaderSource(this.shader, source);
      this.gl.compileShader(this.shader);
      let compiled = this.gl.getShaderParameter(this.shader, this.gl.COMPILE_STATUS);
      if(!compiled) {
        let error = this.gl.getShaderInfoLog(this.shader);
        throw new Error("Could not compile shader: " + error);
      }
    }

    get glType() {
      switch(this.type) {
        case Shader.VERTEX: return this.gl.VERTEX_SHADER;
        case Shader.FRAGMENT: return this.gl.FRAGMENT_SHADER;
        default: throw new Error('No such Shader Type');
      }
    }
  }
  Shader.VERTEX = Symbol('VERTEX');
  Shader.FRAGMENT = Symbol('FRAGMENT');

  class VertexShader extends Shader {
    constructor({context, source}) {
      super({context, source, type: Shader.VERTEX});
    }
  }

  class FragmentShader extends Shader {
    constructor({context, source}) {
      super({context, source, type: Shader.FRAGMENT});
    }
  }

  class Program {
    get gl() { return this.context.gl; }
    constructor({context, vertex, fragment}) {
      this.context = context;

      this.attributes = {};
      this.uniforms = {};
      this.create({vertex, fragment});
    }

    create({vertex, fragment}) {
      //TODO Cleanup old program and cache first
      this.program = this.gl.createProgram();
      this.gl.attachShader(this.program, vertex.shader);
      this.gl.attachShader(this.program, fragment.shader);
      this.gl.linkProgram(this.program);
      this.gl.validateProgram(this.program);

      let linked = this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS);
      if(!linked) {
        let error = this.gl.getProgramInfoLog(this.program);
        throw new Error("Could not link program: " + error);
      }
    }

    attribute(name) {
      if(this.attributes[name]) return this.attributes[name];

      let attrib = this.gl.getAttribLocation(this.program, name);
      if(attrib === -1) throw new Error('Attribute not found');
      this.attributes[name] = attrib;
      return attrib;
    }

    uniform(name) {
      if(this.uniforms[name]) return this.uniforms[name];

      let uniform = this.gl.getUniformLocation(this.program, name);
      if(uniform === null) throw new Error('Uniform not found');
      this.uniforms[name] = uniform;
      return uniform;
    }

    use() {
      this.gl.useProgram(this.program);
    }
  }

  class Geometry {
    get gl() { return this.context.gl; }
    constructor({context, count}) {
      this.context = context;
      this.count = count;
      this.attributes = [];
    }

    add({name, buffer, size, offset=0, stride=0}) {
      this.attributes.push({
        name: name,
        buffer: buffer,
        size: size,
        offset: offset,
        stride: stride,
      });
    }

    draw(program) {
      for(let attribute of this.attributes) {
        let attrib = program.attribute(attribute.name);
        this.gl.enableVertexAttribArray(attrib);
        //TODO Support types other than FLOAT
        this.gl.vertexAttribPointer(attrib, attribute.size,
            this.gl.FLOAT, false, attribute.stride, attribute.offset);
      }
      //TODO Support drawElements
      this.gl.drawArrays(this.gl.TRIANGLES, 0, this.count);
    }

    static quad({context}) {
      let data = new Float32Array([-1,-1,1, -1,-1,1, -1,1,1, -1,1,1]);
      let buffer = new Buffer({context, data: data});
      let geometry = new Geometry({context, count: 6});
      geometry.add({name: 'position', size: 2, buffer: buffer});
      return geometry;
    }
  }

  class State {
    static get empty() { return new State(); }
    constructor() {
      this.textureUnits = [];
    }

    textureUnit(texture) {
      let unit = this.textureUnits.indexOf(texture);
      if(unit === -1) {
        unit = this.textureUnits.length;
        this.textureUnits.push(texture);
      }
      return unit;
    }
  }
  
  class Uniforms {
    get gl() { return this.context.gl; }
    constructor({context, uniforms={}}) {
      this.context = context;
      this.uniforms = uniforms;
    }

    bind({state=State.empty, program}={}) {
      for(let key in this.uniforms) {
        let value = this.uniforms[key];
        try {
          let uniform = program.uniform(key);
          if(value instanceof Texture) {
            let unit = state.textureUnit(value);
            value.bind(unit);
            this.gl.uniform1i(uniform, unit);
          } else if(value instanceof Array ||
              value instanceof Float32Array ||
              value instanceof Float64Array) {
            if(value.length < 1 || value.length > 4) throw new Error('Array must be between 1 and 4');
            this.gl[`uniform${value.length}fv`](uniform, value);
          } else {
            console.log(`Can't figure out type for uniform ${name}`);
          }
        } catch(e) {
          console.log(`No such uniform ${key}`);
        }
      }
    }
  }

  Object.assign(TinyGL, {Context, Texture, Framebuffer, Buffer,
    VertexShader, FragmentShader, Program, Geometry, Uniforms, State});
})(window.TinyGL = window.TinyGL || {});
