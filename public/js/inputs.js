(function() {
  var inputs = {};

  var time = 0;
  var state = {};
  var pool = [];

  inputs.initialize = function() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  };

  function handleKeyDown(ev) {
    pool.push('+' + ev.code);
    new Date().getTime();
  }

  function handleKeyUp(ev) {
    pool.push('-' + ev.code);
  }

  inputs.poolEvents = function(delta) {
    time += delta;
    var p = pool.splice(0);
    for (var i = 0; i < p.length; i++) {
      var e = p[i];
      var code = e.substr(1);
      if (!state[code])
        state[code] = {};
      switch (e[0]) {
        case '+':
          if (state[code].state === 'just_pressed' || state[code].state === 'down')
            break;
          state[code].state = 'just_pressed';
          state[code].time = time;
          break;
        case '-':
          state[code].state = 'released';
          state[code].time = time;
          break;
      }
    }
  };

  inputs.isDown = function(code, repeat1, repeatN) {
    if (!state[code])
      return false;
    if (this.isJustPressed(code)) {
      state[code].repeat = time + repeat1 || 0;
      return true;
    }
    if (state[code].state === 'down') {
      if (time >= state[code].repeat) {
        state[code].repeat = time + repeatN || 0;
        return true;
      }
    }
    return false;
  };

  inputs.isJustPressed = function(code) {
    if (!state[code])
      return false;
    if (state[code].state === 'just_pressed') {
      state[code].state = 'down';
      return true;
    }
    return false;
  };

  window.inputs = inputs;
})();