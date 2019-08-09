(function() {
  var game = {};
  var shapes;

  function randomShape() {
    return shapes[Math.floor(Math.random() * shapes.length)];
  }

  game.Game = function(config) {
    config = Object.assign({board: {}}, config);
    this.board = new game.Board(config.board);
    this.player = new game.Player();
    this.shadow = new game.Player();
    this.hold = new game.Shape();
    this.tempShape = new game.Shape();
    this.reset();
  };

  game.Game.prototype.reset = function() {
    this.in = {};
    this.level = 1;
    this.count = 0;
    this.time = 0;
    this.score = 0;
    this.fallCD = 0;
    this.clearCD = 0;
    this.clearTime = 0;
    this.clearY0 = 0;
    this.clearY1 = 0;
    this.board.reset();
    this.player.reset();
    this.shadow.reset();
    this.next = randomShape();
    this.canHold = false;
    this.hold.reset();
    this.tempShape.reset();
    this.gameOver = false;
  };

  game.Game.prototype.inMoveX = function(dx) {
    this.in.moveX = dx;
  };

  game.Game.prototype.inRotate = function(direction) {
    this.in.rotate = direction;
  };

  game.Game.prototype.inFall = function(fall) {
    this.in.fall = fall;
  };

  game.Game.prototype.inDrop = function(drop) {
    this.in.drop = drop;
  };

  game.Game.prototype.inHold = function(hold) {
    this.in.hold = hold;
  };

  game.Game.prototype.nextFallCD = function() {
    return 0.1 + 0.9 * (99 - this.level) / 98;
  };

  game.Game.prototype.calcShadow = function() {
    this.shadow.set(this.player);
    do {
      this.shadow.y--;
    } while (this.board.checkPlayer(this.shadow));
    this.shadow.y++;
  };

  game.Game.prototype.setPlayer = function(shape) {
    this.player.set(shape);
    this.player.x = Math.floor((this.board.width - this.player.size) / 2);
    this.player.y = Math.floor(this.board.height - this.player.size);
    do {
      this.player.y++;
    } while (this.board.checkPlayer(this.player, true));
    this.player.y--;
    this.calcShadow();
  };

  game.Game.prototype.placePlayer = function() {
    if (this.player.size) {
      var rows = this.board.placePlayer(this.player);
      this.count++;
      if (this.count % 8 === 0)
        if (this.level < 99)
          this.level++;
      this.score += 1 << rows * 2;
      if (rows > 0) {
        this.clearTime = this.time;
        this.clearCD = .6;
        this.clearY0 = this.player.y;
        this.clearY1 = this.player.y + this.player.size - 1;
        this.player.reset();
        this.shadow.reset();
        return;
      }
    }
    this.setPlayer(this.next);
    this.next = randomShape();
    this.canHold = true;
  };

  game.Game.prototype.setGameOver = function() {
    this.gameOver = true;
    this.player.reset();
    this.shadow.reset();
  };

  game.Game.prototype.update = function(delta) {
    if (this.gameOver)
      return;
    this.time += delta;
    if (this.clearCD === 0) {
      this.updateInMoveX(delta);
      this.updateInRotate(delta);
      this.updateInFall(delta);
      this.updateInDrop(delta);
      this.updateInHold(delta);
      this.updateFall(delta);
    } else {
      this.updateClear(delta);
    }
  };

  game.Game.prototype.updateInMoveX = function(delta) {
    if (this.in.moveX) {
      this.player.x += this.in.moveX;
      if (this.board.checkPlayer(this.player)) {
        this.calcShadow();
        delete this.in.moveX;
        return;
      }
      this.player.x -= this.in.moveX;
      delete this.in.moveX;
    }
  };

  game.Game.prototype.updateInRotate = function(delta) {
    if (this.in.rotate) {
      this.player.rotate(this.in.rotate);
      if (this.board.checkPlayer(this.player)) {
        this.calcShadow();
        delete this.in.rotate;
        return;
      }
      this.player.rotate(-this.in.rotate);
      delete this.in.rotate;
    }
  };

  game.Game.prototype.updateInFall = function(delta) {
    if (this.in.fall) {
      this.fallCD = 0;
      delete this.in.fall;
    }
  };

  game.Game.prototype.updateInDrop = function(delta) {
    if (this.in.drop) {
      this.fallCD = 0;
      this.player.set(this.shadow);
      delete this.in.drop;
    }
  };

  game.Game.prototype.updateInHold = function(delta) {
    if (this.in.hold) {
      if (!this.canHold) {
        delete this.in.drop;
        return;
      }
      this.canHold = false;
      if (this.hold.size)
        this.tempShape.set(this.hold);
      this.hold.set(this.player);
      if (this.tempShape.size === 0) {
        this.setPlayer(this.next);
        this.next = randomShape();
      } else
        this.setPlayer(this.tempShape);
      this.tempShape.reset();
      delete this.in.drop;
    }
  };

  game.Game.prototype.updateFall = function(delta) {
    this.fallCD -= delta;
    if (this.fallCD <= 0) {
      this.fallCD += this.nextFallCD();
      if (this.player.size) {
        this.player.y--;
        if (this.board.checkPlayer(this.player))
          return;
        this.player.y++;
      }
      this.placePlayer();
      if (this.board.checkPlayer(this.player))
        return;
      this.placePlayer();
      this.setGameOver();
    }
  };

  game.Game.prototype.updateClear = function(delta) {
    this.clearCD -= delta;
    if (this.clearCD <= 0) {
      this.clearCD = 0;
      for (var y = this.clearY1; y >= this.clearY0; y--)
        if (this.board.isFullRow(y))
          this.board.removeRow(y);
      this.setPlayer(this.next);
      this.next = randomShape();
      this.canHold = true;
    }
  };

  game.Board = function(config) {
    config = Object.assign({width: 10, height: 20}, config);
    this.width = config.width;
    this.height = config.height;
    this.rows = new Array(this.height);
  };

  game.Board.prototype.reset = function() {
    for (var i = 0; i < this.height; i++)
      this.rows[i] = 0;
  };

  game.Board.prototype.setCell = function(x, y, cell) {
    if (cell)
      this.rows[y] |= 1 << x;
    else
      this.rows[y] &= ~(1 << x);
  };

  game.Board.prototype.isFullRow = function(y) {
    return this.rows[y] === (1 << this.width) - 1;
  };

  game.Board.prototype.removeRow = function(y) {
    for (var i = y; i < this.height; i++)
      this.rows[i] = this.rows[i + 1];
  };

  game.Board.prototype.hasCell = function(x, y) {
    return ((this.rows[y] >>> x) & 1) === 1;
  };

  game.Board.prototype.isOutOfBounds = function(x, y) {
    return x < 0 || x >= this.width || y < 0 || y >= this.height;
  };

  game.Board.prototype.checkPlayer = function(player, ignoreRows) {
    for (var y = 0; y < player.size; y++)
      for (var x = 0; x < player.size; x++) {
        if (!player.hasCell(x, y))
          continue;
        var bx = player.x + x;
        var by = player.y + y;
        if (this.isOutOfBounds(bx, by))
          return false;
        if (!ignoreRows)
          if (this.hasCell(bx, by))
            return false;
      }
    return true;
  };

  game.Board.prototype.placePlayer = function(player) {
    var rows = 0;
    for (var y = 0; y < player.size; y++) {
      var by = player.y + y;
      for (var x = 0; x < player.size; x++) {
        if (!player.hasCell(x, y))
          continue;
        var bx = player.x + x;
        if (this.isOutOfBounds(bx, by))
          continue;
        this.setCell(bx, by, true);
      }
      if (this.isFullRow(by))
        rows++;
    }
    return rows;
  };

  game.Shape = function(size, mask) {
    this.size = size;
    this.mask = mask;
    this.calcCenter();
  };

  game.Shape.prototype.reset = function() {
    this.size = 0;
    this.mask = 0;
    this.centerX = 0;
    this.centerY = 0;
  };

  game.Shape.prototype.calcCenter = function() {
    var xMin = this.size - 1;
    var yMin = this.size - 1;
    var xMax = 0;
    var yMax = 0;
    for (var y = 0; y < this.size; y++)
      for (var x = 0; x < this.size; x++) {
        if (!this.hasCell(x, y))
          continue;
        xMin = Math.min(xMin, x);
        yMin = Math.min(yMin, y);
        xMax = Math.max(xMax, x + 1);
        yMax = Math.max(yMax, y + 1);
      }
    this.centerX = (xMin + xMax) / 2;
    this.centerY = (yMin + yMax) / 2;
  };

  game.Shape.prototype.set = function(shape) {
    this.size = shape.size;
    this.mask = shape.mask;
    this.calcCenter();
  };

  game.Shape.prototype.hasCell = function(x, y) {
    return ((this.mask >>> (x + y * this.size)) & 1) === 1;
  };

  game.Shape.prototype.rotate = function(direction) {
    if (direction < 0)
      return this.rotateCCW();
    else if (direction > 0)
      return this.rotateCW();
  };

  game.Shape.prototype.rotateCW = function() {
    var mask = 0;
    for (var y = 0; y < this.size; y++)
      for (var x = 0; x < this.size; x++) {
        if (!this.hasCell(x, y))
          continue;
        var ny = this.size - 1 - x;
        var nx = y;
        mask |= 1 << (nx + ny * this.size);
      }
    this.mask = mask;
    this.calcCenter();
  };

  game.Shape.prototype.rotateCCW = function() {
    var mask = 0;
    for (var y = 0; y < this.size; y++)
      for (var x = 0; x < this.size; x++) {
        if (!this.hasCell(x, y))
          continue;
        var ny = x;
        var nx = this.size - 1 - y;
        mask |= 1 << (nx + ny * this.size);
      }
    this.mask = mask;
    this.calcCenter();
  };

  game.Player = function() {
    game.Shape.call(this);
    this.reset();
  };

  game.Player.prototype = Object.create(game.Shape.prototype);

  game.Player.prototype.reset = function() {
    this.size = undefined;
    this.mask = undefined;
    this.x = undefined;
    this.y = undefined;
  };

  game.Player.prototype.set = function(player) {
    game.Shape.prototype.set.call(this, player);
    if (player instanceof game.Player) {
      this.x = player.x;
      this.y = player.y;
    }
  };

  shapes = [
    new game.Shape(4, parseInt('0000111100000000', 2)),
    new game.Shape(3, parseInt('111001000', 2)),
    new game.Shape(3, parseInt('001111000', 2)),
    new game.Shape(3, parseInt('100111000', 2)),
    new game.Shape(3, parseInt('110011000', 2)),
    new game.Shape(3, parseInt('011110000', 2)),
    new game.Shape(2, parseInt('1111', 2)),
  ];
  window.game = game;
}());