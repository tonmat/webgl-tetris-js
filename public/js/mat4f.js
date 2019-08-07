function Mat4f() {
  this.array = new Float32Array(16);
}

Mat4f.prototype.setOrtho = function(left, right, bottom, top) {
  this.array[0] = 2 / (right - left);
  this.array[1] = 0;
  this.array[2] = 0;
  this.array[3] = -(right + left) / (right - left);

  this.array[4] = 0;
  this.array[5] = 2 / (top - bottom);
  this.array[6] = 0;
  this.array[7] = -(top + bottom) / (top - bottom);

  this.array[8] = 0;
  this.array[9] = 0;
  this.array[10] = 1;
  this.array[11] = 0;

  this.array[12] = 0;
  this.array[13] = 0;
  this.array[14] = 0;
  this.array[15] = 1;
  return this;
};