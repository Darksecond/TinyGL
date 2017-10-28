(function(TinyGL){
  'use strict';
  class Camera {
    constructor({context}) {
      this.context = context;
      this.texture = new TinyGL.Texture({context});
      this.video = document.createElement('video');
      this.video.addEventListener('playing', ()=>this.ready = true);
      this.video.addEventListener('timeupdate', ()=>this.ready = true);
      this.ready = false;

      this.create();
    }

    update() {
      if(!this.ready) return;
      this.texture.bind();
      this.texture.updateVideo(this.video);
    }

    create() {
      //TODO Cleanup old texture, video and loop
      let success = (stream)=>{
        this.video.src = window.URL.createObjectURL(stream);
        this.video.play();
      };
      let failure = ()=>{
        console.error('Something went wrong with camera');
      };
      navigator.getUserMedia({video: true}, success, failure);
    }
  }

  TinyGL.Media = TinyGL.Media || {};
  Object.assign(TinyGL.Media, {Camera});
})(window.TinyGL = window.TinyGL || {});
