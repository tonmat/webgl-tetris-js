(function() {
  var graphics = {};
  var gl;
  var oes_vao;
  var cfg;

  graphics.gl = undefined;
  graphics.surface = {};
  graphics.viewport = {};

  graphics.initialize = function(config) {
    cfg = Object.assign({}, config);
    graphics._canvas = document.createElement('canvas');
    graphics._canvas.style.marginBottom = '-4px';
    gl = graphics.gl = graphics._canvas.getContext('webgl');
    oes_vao = gl.getExtension('OES_vertex_array_object');
    console.log('Surface created');
    console.log(gl.getParameter(gl.VERSION));
    console.log(gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
    console.log(gl.getParameter(gl.VENDOR));
    window.addEventListener('resize', resizeSurface);
    resizeSurface();
    document.body.appendChild(graphics._canvas);
  };

  function resizeSurface() {
    graphics.surface.width = document.body.offsetWidth;
    graphics.surface.height = document.body.offsetHeight;
    graphics.surface.ratio = graphics.surface.width / graphics.surface.height;
    graphics._canvas.setAttribute('width', graphics.surface.width);
    graphics._canvas.setAttribute('height', graphics.surface.height);
    console.log('Surface resized to ' + graphics.surface.width + ' x ' + graphics.surface.height);

    var vw = graphics.surface.width;
    var vh = graphics.surface.height;
    if (cfg.ratio !== undefined)
      if (graphics.surface.ratio > cfg.ratio)
        vw = vh * cfg.ratio;
      else
        vh = vw / cfg.ratio;
    var x = (graphics.surface.width - vw) / 2;
    var y = (graphics.surface.height - vh) / 2;
    setViewport(x, y, vw, vh);
  }

  function setViewport(x, y, width, height) {
    graphics.viewport.x = Math.floor(x);
    graphics.viewport.y = Math.floor(y);
    graphics.viewport.width = width;
    graphics.viewport.height = height;
    graphics.viewport.ratio = width / height;
    gl.viewport(graphics.viewport.x, graphics.viewport.y, graphics.viewport.width, graphics.viewport.height);
    console.log('Viewport set to ' + graphics.viewport.width + ' x ' + graphics.viewport.height);
  }

  graphics.Shader = function() {
    var shaders = Array.prototype.map.call(arguments, this._createShader);
    this._program = gl.createProgram();
    shaders.forEach(function(shader) {
      gl.attachShader(this._program, shader);
    }.bind(this));
    gl.linkProgram(this._program);
    var status = gl.getProgramParameter(this._program, gl.LINK_STATUS);
    if (status !== true) {
      var infoLog = gl.getProgramInfoLog(this._program);
      console.error('Error linking program: ' + infoLog);
      shaders.forEach(function(shader) {
        gl.deleteShader(shader);
      });
      gl.deleteProgram(this._program);
    }
    this._uniformsLocations = {};
  };

  graphics.Shader._binded = undefined;

  graphics.Shader.unbind = function() {
    if (graphics.Shader._binded === undefined)
      return;
    gl.useProgram(null);
  };

  graphics.Shader.prototype._createShader = function(scriptId) {
    var script = document.getElementById(scriptId);
    if (!script) {
      console.error('Element id not found: ' + scriptId);
      return;
    }
    var type = script.getAttribute('type');
    switch (type) {
      case 'x-shader/x-vertex':
        type = gl.VERTEX_SHADER;
        break;
      case 'x-shader/x-fragment':
        type = gl.FRAGMENT_SHADER;
        break;
      default:
        console.error('Invalid shader type: ' + type);
        break;
    }
    var source = script.text;
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (status !== true) {
      var infoLog = gl.getShaderInfoLog(shader);
      console.error('Error compiling shader: ' + infoLog);
      gl.deleteShader(shader);
      return;
    }
    return shader;
  };

  graphics.Shader.prototype.bind = function() {
    if (graphics.Shader._binded === this._program)
      return;
    gl.useProgram(this._program);
  };

  graphics.Shader.prototype._getUniformLocation = function(name) {
    if (this._uniformsLocations.hasOwnProperty(name))
      return this._uniformsLocations[name];
    return this._uniformsLocations[name] = gl.getUniformLocation(this._program, name);
  };

  graphics.Shader.prototype.setUniform1i = function(name, x) {
    gl.uniform1i(this._getUniformLocation(name), x);
  };

  graphics.Shader.prototype.setUniformMat4f = function(name, value) {
    gl.uniformMatrix4fv(this._getUniformLocation(name), false, value.array);
  };

  graphics.Texture = function(id) {
    var image = document.getElementById(id);
    this.width = image.width;
    this.height = image.height;
    this._texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);
  };

  graphics.Texture._binded = undefined;

  graphics.Texture.unbind = function() {
    if (graphics.Texture._binded === undefined)
      return;
    gl.bindTexture(gl.TEXTURE_2D, null);
  };

  graphics.Texture.prototype.bind = function() {
    if (graphics.Texture._binded === this._texture)
      return;
    gl.bindTexture(gl.TEXTURE_2D, this._texture);
  };

  graphics.Texture.prototype.region = function(x, y, width, height) {
    var s0 = x / this.width;
    var t0 = y / this.height;
    var s1 = (x + width) / this.width;
    var t1 = (y + height) / this.height;
    return new graphics.TextureRegion(x, y, width, height, s0, t0, s1, t1);
  };

  graphics.TextureRegion = function(x, y, width, height, s0, t0, s1, t1) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.s0 = s0;
    this.t0 = t0;
    this.s1 = s1;
    this.t1 = t1;
  };

  graphics.Color = function() {
    this.red = 1;
    this.green = 1;
    this.blue = 1;
  };

  graphics.Color.prototype.set = function(red, green, blue) {
    if (red instanceof graphics.Color) {
      this.red = red.red;
      this.green = red.green;
      this.blue = red.blue;
    } else {
      this.red = red;
      this.green = green;
      this.blue = blue;
    }
  };

  graphics.Sprite = function() {
    this.x = 0;
    this.y = 0;
    this.width = 1;
    this.height = 1;
    this.textureRegion = undefined;
    this.color = new graphics.Color();
    this.alpha = 1;
  };

  graphics.Label = function() {
    this.text = '';
    this.x = 0;
    this.y = 0;
    this.hAlign = graphics.Label.HAlign.LEFT;
    this.hSpacing = .75;
    this.vSpacing = .75;
    this.size = 1;
    this.color = new graphics.Color();
    this.alpha = 1;
  };

  graphics.Label.HAlign = {
    LEFT: -1,
    CENTER: 0,
    RIGHT: 1,
  };

  graphics.Batch = function(capacity) {
    this._capacity = capacity;
    this._count = 0;
    this._vertices = new Float32Array(capacity * 8);
    this._vertices_size = 0;
    this._vertices_size_prev = -1;
    this._indices = new Uint16Array(capacity * 6);
    this._indices_size = 0;
    this._indices_size_prev = -1;
    this._drawing = false;

    if (oes_vao) {
      this._vao = oes_vao.createVertexArrayOES();
      oes_vao.bindVertexArrayOES(this._vao);
    }

    this._vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this._vertices.byteLength, gl.STREAM_DRAW);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 8, 0);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, Float32Array.BYTES_PER_ELEMENT * 8, Float32Array.BYTES_PER_ELEMENT * 4);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    this._ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indices.byteLength, gl.STREAM_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    if (oes_vao) {
      oes_vao.bindVertexArrayOES(null);
    }
  };

  graphics.Batch.prototype._addIndices = function() {
    var newSize = this._indices_size + 6;
    if (newSize > this._indices.length) {
      console.error('index array buffer overflow ' + newSize + ' > ' + this._indices.length);
      return;
    }

    var verticesCount = this._vertices_size / 8;
    this._indices[this._indices_size] = verticesCount;
    this._indices[this._indices_size + 1] = verticesCount + 1;
    this._indices[this._indices_size + 2] = verticesCount + 2;
    this._indices[this._indices_size + 3] = verticesCount + 2;
    this._indices[this._indices_size + 4] = verticesCount + 1;
    this._indices[this._indices_size + 5] = verticesCount + 3;
    this._indices_size = newSize;
  };

  graphics.Batch.prototype._addSpriteVertex = function(sprite, w, h) {
    var newSize = this._vertices_size + 8;
    if (newSize > this._vertices.length) {
      console.error('vertex array buffer overflow ' + newSize + ' > ' + this._vertices.length);
      return;
    }

    this._vertices[this._vertices_size] = sprite.x + w * sprite.width;
    this._vertices[this._vertices_size + 1] = sprite.y + h * sprite.height;
    this._vertices[this._vertices_size + 2] = w * sprite.textureRegion.s1 + (1 - w) * sprite.textureRegion.s0;
    this._vertices[this._vertices_size + 3] = h * sprite.textureRegion.t0 + (1 - h) * sprite.textureRegion.t1;
    this._vertices[this._vertices_size + 4] = sprite.color.red;
    this._vertices[this._vertices_size + 5] = sprite.color.green;
    this._vertices[this._vertices_size + 6] = sprite.color.blue;
    this._vertices[this._vertices_size + 7] = sprite.alpha;
    this._vertices_size = newSize;
  };

  graphics.Batch.prototype.drawSprite = function(sprite) {
    var newCount = this._count + 1;
    if (newCount > this._capacity) {
      console.error('sprite overflow ' + newCount + ' > ' + this._capacity);
      return;
    }

    this._addIndices();
    this._addSpriteVertex(sprite, 0, 1);
    this._addSpriteVertex(sprite, 0, 0);
    this._addSpriteVertex(sprite, 1, 1);
    this._addSpriteVertex(sprite, 1, 0);
    this._count = newCount;
  };

  graphics.Batch.prototype._addLabelVertex = function(label, x, y, w, h, s, t) {
    var newSize = this._vertices_size + 8;
    if (newSize > this._vertices.length) {
      console.error('vertex array buffer overflow ' + newSize + ' > ' + this._vertices.length);
      return;
    }

    this._vertices[this._vertices_size] = label.x + x + w * label.size;
    this._vertices[this._vertices_size + 1] = label.y + y + h * label.size;
    this._vertices[this._vertices_size + 2] = s;
    this._vertices[this._vertices_size + 3] = t;
    this._vertices[this._vertices_size + 4] = label.color.red;
    this._vertices[this._vertices_size + 5] = label.color.green;
    this._vertices[this._vertices_size + 6] = label.color.blue;
    this._vertices[this._vertices_size + 7] = label.alpha;
    this._vertices_size = newSize;
  };

  graphics.Batch.prototype._drawChar = function(label, char, x, y) {
    var index = char.charCodeAt(0) - 32;
    var s = index % 16;
    var t = Math.floor(index / 16);
    var s0 = s / 16;
    var t0 = t / 16;
    var s1 = (s + 1) / 16;
    var t1 = (t + 1) / 16;
    this._addIndices();
    this._addLabelVertex(label, x, y, 0, 1, s0, t0);
    this._addLabelVertex(label, x, y, 0, 0, s0, t1);
    this._addLabelVertex(label, x, y, 1, 1, s1, t0);
    this._addLabelVertex(label, x, y, 1, 0, s1, t1);
  };

  graphics.Batch.prototype._getLabelWidth = function(label) {
    var w = 0;
    var x = 0;
    for (var i = 0; i < label.text.length; i++) {
      var c = label.text[i];
      if (c === '\n') {
        w = Math.max(w, x);
        x = 0;
        continue;
      }
      x++;
    }
    w = Math.max(w, x);
    return label.size * (label.hSpacing * (w - 1) + 1);
  };

  graphics.Batch.prototype.drawLabel = function(label) {
    var w;
    switch (label.hAlign) {
      default:
        w = 0;
        break;
      case graphics.Label.HAlign.CENTER:
        w = (this._getLabelWidth(label)) / 2;
        break;
      case graphics.Label.HAlign.RIGHT:
        w = this._getLabelWidth(label);
        break;
    }
    var x = 0;
    var y = 0;
    for (var i = 0; i < label.text.length; i++) {
      var c = label.text[i];
      if (c === '\n') {
        x = 0;
        y -= label.size * label.vSpacing;
        continue;
      }
      this._drawChar(label, c, x - w, y);
      x += label.size * label.hSpacing;
    }
  };

  graphics.Batch.prototype.draw = function(o) {
    if (o instanceof graphics.Sprite)
      this.drawSprite(o);
    else if (o instanceof graphics.Label)
      this.drawLabel(o);
  };

  graphics.Batch.prototype.begin = function() {
    if (this._drawing)
      return;
    this._drawing = true;

    this._count = 0;
    this._vertices_size = 0;
    this._indices_size = 0;
  };

  graphics.Batch.prototype.end = function() {
    if (!this._drawing)
      return;
    this._drawing = false;

    if (oes_vao) {
      oes_vao.bindVertexArrayOES(this._vao);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._ibo);

    if (this._vertices_size === this._vertices_size_prev)
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._vertices);
    else
      gl.bufferData(gl.ARRAY_BUFFER, this._vertices, gl.STREAM_DRAW);

    if (this._indices_size === this._indices_size_prev)
      gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, 0, this._indices);
    else
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this._indices, gl.STREAM_DRAW);

    gl.drawElements(gl.TRIANGLES, this._indices_size, gl.UNSIGNED_SHORT, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    if (oes_vao) {
      oes_vao.bindVertexArrayOES(null);
    }

    this._vertices_size_prev = this._vertices_size;
    this._indices_size_prev = this._indices_size;
  };

  window.graphics = graphics;
})();