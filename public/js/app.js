graphics.initialize({ratio: .75});
inputs.initialize();

var gl = graphics.gl;
var projection = new Mat4f();
var shader = new graphics.Shader('vertex-shader', 'fragment-shader');
var texture = new graphics.Texture('spritesheet-texture');

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.enable(gl.CULL_FACE);
gl.clearColor(0, 0.025, 0, 1);
gl.activeTexture(gl.TEXTURE0);

projection.setOrtho(0, 15, 0, 20);

shader.bind();
shader.setUniformMat4f('u_projection', projection);
shader.setUniform1i('u_material', 0);

texture.bind();

var tetris = new game.Game();

var sprites = {
  bg: createBGSprite(),
  bg2: createBG2Sprite(),
  bg3: createBG3Sprite(),
  bg4: createBG4Sprite(),
  pieces: {
    boardBG: createBoardBGPieceSprite(),
    boardFG: createBoardFGPieceSprite(),
    clear: createClearPieceSprite(),
    player: createPlayerPieceSprite(),
    shadow: createShadowPieceSprite(),
  },
};

var labels = {
  time: createTimeLabel(),
  timeValue: createTimeValueLabel(),
  score: createScoreLabel(),
  scoreValue: createScoreValueLabel(),
  level: createLevelLabel(),
  levelValue: createLevelValueLabel(),
  next: createNextLabel(),
  hold: createHoldLabel(),
  gameOver: createGameOverLabel(),
};

var batch = new graphics.Batch(2048);

function createBGSprite() {
  var sprite = new graphics.Sprite();
  sprite.textureRegion = texture.region(0, 64, 1, 1);
  sprite.color.set(1, 1, 1);
  return sprite;
}

function createBG2Sprite() {
  var sprite = new graphics.Sprite();
  sprite.textureRegion = texture.region(0, 64, 1, 1);
  sprite.color.set(.9, .95, .9);
  return sprite;
}

function createBG3Sprite() {
  var sprite = new graphics.Sprite();
  sprite.textureRegion = texture.region(0, 64, 1, 1);
  sprite.color.set(.2, .3, .2);
  sprite.alpha = 0.75;
  return sprite;
}

function createBG4Sprite() {
  var sprite = new graphics.Sprite();
  sprite.textureRegion = texture.region(0, 64, 1, 1);
  sprite.color.set(.08, .10, .08);
  sprite.alpha = 0.96;
  return sprite;
}

function createBoardBGPieceSprite() {
  var sprite = new graphics.Sprite();
  sprite.textureRegion = texture.region(0, 64, 8, 8);
  sprite.color.set(.975, .96, .975);
  return sprite;
}

function createBoardFGPieceSprite() {
  var sprite = new graphics.Sprite();
  sprite.textureRegion = texture.region(0, 64, 8, 8);
  sprite.color.set(0, .1, 0);
  return sprite;
}

function createClearPieceSprite() {
  var sprite = new graphics.Sprite();
  sprite.textureRegion = texture.region(0, 64, 8, 8);
  return sprite;
}

function createPlayerPieceSprite() {
  var sprite = new graphics.Sprite();
  sprite.textureRegion = texture.region(0, 64, 8, 8);
  return sprite;
}

function createShadowPieceSprite() {
  var sprite = new graphics.Sprite();
  sprite.textureRegion = texture.region(0, 64, 8, 8);
  return sprite;
}

function createTimeLabel() {
  var label = new graphics.Label();
  label.text = 'TIME';
  label.x = 4.5;
  label.y = tetris.board.height - 2;
  label.size = .5;
  label.hAlign = graphics.Label.HAlign.RIGHT;
  label.color.set(.5, .6, .5);
  return label;
}

function createTimeValueLabel() {
  var label = new graphics.Label();
  label.x = 4.5;
  label.y = tetris.board.height - 3;
  label.hAlign = graphics.Label.HAlign.RIGHT;
  label.color.set(.9, 1, .9);
  return label;
}

function createScoreLabel() {
  var label = new graphics.Label();
  label.text = 'SCORE';
  label.x = 4.5;
  label.y = tetris.board.height - 4;
  label.size = .5;
  label.hAlign = graphics.Label.HAlign.RIGHT;
  label.color.set(.5, .6, .5);
  return label;
}

function createScoreValueLabel() {
  var label = new graphics.Label();
  label.x = 4.5;
  label.y = tetris.board.height - 5;
  label.hAlign = graphics.Label.HAlign.RIGHT;
  label.color.set(.9, 1, .9);
  return label;
}

function createLevelLabel() {
  var label = new graphics.Label();
  label.text = 'LEVEL';
  label.x = 4.5;
  label.y = tetris.board.height - 6;
  label.size = .5;
  label.hAlign = graphics.Label.HAlign.RIGHT;
  label.color.set(.5, .6, .5);
  return label;
}

function createLevelValueLabel() {
  var label = new graphics.Label();
  label.x = 4.5;
  label.y = tetris.board.height - 7;
  label.hAlign = graphics.Label.HAlign.RIGHT;
  label.color.set(.9, 1, .9);
  return label;
}

function createNextLabel() {
  var label = new graphics.Label();
  label.text = 'NEXT';
  label.x = 0;
  label.y = 5.25;
  label.size = .75;
  label.hAlign = graphics.Label.HAlign.LEFT;
  label.color.set(.5, .6, .5);
  return label;
}

function createHoldLabel() {
  var label = new graphics.Label();
  label.text = 'HOLD';
  label.x = 0;
  label.y = 11.5;
  label.size = .75;
  label.hAlign = graphics.Label.HAlign.LEFT;
  label.color.set(.5, .6, .5);
  return label;
}

function createGameOverLabel() {
  var label = new graphics.Label();
  label.text = 'GAME\nOVER';
  label.x = 5 + tetris.board.width / 2;
  label.y = 1 + tetris.board.height / 2;
  label.vSpacing = 1;
  label.size = 3;
  label.hAlign = graphics.Label.HAlign.CENTER;
  label.color.set(.5, 1, .5);
  return label;
}

var paused = false;

function update(delta) {
  var reset = false;
  var dx = 0;
  var rotate = 0;
  var fall = false;
  var drop = false;
  var hold = false;
  inputs.poolEvents(delta);
  if (inputs.isDown('KeyP', 1, 1)) paused = !paused;
  if (inputs.isDown('KeyR', 1, 1)) reset = true;
  if (inputs.isDown('ArrowLeft', 0.16, 0.04)) dx--;
  if (inputs.isDown('ArrowRight', 0.16, 0.04)) dx++;
  if (inputs.isDown('ArrowDown', 0.16, 0.04)) fall = true;
  if (inputs.isDown('ArrowUp', 1, 1)) drop = true;
  if (inputs.isDown('ControlLeft', 1, 1)) hold = true;
  if (inputs.isDown('Space', 0.16, 0.04)) rotate = 1;

  if (tetris.gameOver)
    paused = false;

  if (reset)
    tetris.reset();
  if (!paused) {
    tetris.inMoveX(dx);
    tetris.inRotate(rotate);
    tetris.inFall(fall);
    tetris.inDrop(drop);
    tetris.inHold(hold);
    tetris.update(delta);
  }
}

function padLeft(str, pad) {
  return pad.substring(0, pad.length - str.length) + str;
}

function formatTime(t) {
  var s = Math.floor(t);
  var m = Math.floor(s / 60);
  s %= 60;
  return m.toString() + ':' + padLeft(s.toString(), '00');
}

function renderBoard() {
  renderBG(sprites.bg, 5, 0, tetris.board.width, tetris.board.height);
  for (var y = 0; y < tetris.board.height; y++) {
    var isFullRow = tetris.board.isFullRow(y);
    var spt_board;
    if (isFullRow)
      spt_board = sprites.pieces.clear;
    for (var x = 0; x < tetris.board.width; x++) {
      var spt;
      if (paused)
        spt = sprites.pieces.boardFG;
      else if (isFullRow)
        spt = sprites.pieces.clear;
      else if (tetris.board.hasCell(x, y))
        spt = sprites.pieces.boardFG;
      else
        spt = sprites.pieces.boardBG;
      spt.x = x + 5;
      spt.y = y;
      batch.draw(spt);
    }
  }
}

function renderShape(shape, spt, wx, wy) {
  if (shape instanceof game.Player) {
    wx += shape.x;
    wy += shape.y;
  }
  for (var y = 0; y < shape.size; y++)
    for (var x = 0; x < shape.size; x++) {
      if (shape.hasCell(x, y)) {
        spt.x = wx + x;
        spt.y = wy + y;
        batch.draw(spt);
      }
    }
}

function renderShapeBox(shape, spt, x, y) {
  renderBG(sprites.bg2, x, y, 4, 4);
  if (shape.size) {
    var wx = x + 2 - shape.centerX;
    var wy = y + 2 - shape.centerY;
    renderShape(shape, spt, wx, wy);
  }
}

function renderBG(spt, x, y, w, h) {
  spt.x = x;
  spt.y = y;
  spt.width = w;
  spt.height = h;
  batch.draw(spt);
}

function renderTime() {
  labels.timeValue.text = formatTime(tetris.time);
  batch.draw(labels.time);
  batch.draw(labels.timeValue);
}

function renderScore() {
  labels.scoreValue.text = tetris.score.toString();
  batch.draw(labels.score);
  batch.draw(labels.scoreValue);
}

function renderLevel() {
  labels.levelValue.text = tetris.level.toString();
  batch.draw(labels.level);
  batch.draw(labels.levelValue);
}

function renderNext() {
  batch.draw(labels.next);
}

function renderHold() {
  batch.draw(labels.hold);
}

function renderGameOver() {
  batch.draw(labels.gameOver);
}

function render(time) {
  var i1 = Math.abs(Math.cos(.7 * time));
  var i2 = Math.abs(Math.sin(1.7 * time));
  var i3 = 4 * (tetris.time - tetris.clearTime);
  var i4;
  sprites.pieces.player.color.set(.4, .1 * i1 + .5, .4);
  sprites.pieces.shadow.color.set(.6, .8, .6);
  sprites.pieces.shadow.alpha = .4 + .1 * i2;
  if (i3 < .5) {
    i4 = i3 * 2;
    sprites.pieces.clear.color.set(.5 * i4, .1 + .9 * i4, .5 * i4);
    sprites.pieces.clear.alpha = 1;
  } else {
    i4 = Math.max(0, 1.5 - i3);
    sprites.pieces.clear.color.set(.5, 1, .5);
    sprites.pieces.clear.alpha = i4;
  }

  gl.clear(gl.COLOR_BUFFER_BIT);
  batch.begin();

  renderBoard();
  if (!paused) {
    renderShape(tetris.shadow, sprites.pieces.shadow, 5, 0);
    renderShape(tetris.player, sprites.pieces.player, 5, 0);
    renderShapeBox(tetris.next, sprites.pieces.boardFG, 0, 1);
    renderShapeBox(tetris.hold, sprites.pieces.boardFG, 0, 7);
    if (!tetris.canHold)
      renderBG(sprites.bg3, 0, 7, 4, 4);
  }
  if (tetris.gameOver) {
    renderBG(sprites.bg4, 5, 0, tetris.board.width, tetris.board.height);
    renderBG(sprites.bg4, 0, 1, 4, 4);
    renderBG(sprites.bg4, 0, 7, 4, 4);
    renderGameOver();
  }
  renderTime();
  renderScore();
  renderLevel();
  renderNext();
  renderHold();

  batch.end();
}

{
  var lastUpdate = 0;
  var delta = 0;

  function loop(time) {
    delta += time - lastUpdate;
    lastUpdate = time;
    while (delta >= 20) {
      delta -= 20;
      update(0.02);
    }
    render(0.001 * time);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}