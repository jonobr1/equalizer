var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};

// src/underscore.js
function clamp(v, a, b) {
  return Math.min(Math.max(v, a), b);
}
function defaults(base) {
  if (arguments.length < 2) {
    return base;
  }
  for (var i = 1; i < arguments.length; i++) {
    var obj = arguments[i];
    for (var k in obj) {
      if (typeof base[k] == "undefined") {
        base[k] = obj[k];
      }
    }
  }
  return base;
}
function extend(base) {
  if (arguments.length < 2) {
    return base;
  }
  for (var i = 1; i < arguments.length; i++) {
    var obj = arguments[i];
    for (var k in obj) {
      base[k] = obj[k];
    }
  }
  return base;
}
function mod(v, l) {
  while (v < 0) {
    v += l;
  }
  return v % l;
}

// src/sound.js
var identity = function(v) {
  return v;
};
var Context;
var has;
try {
  Context = AudioContext || webkitAudioContext;
  has = !!Context;
} catch (e) {
  Context = null;
  has = false;
}
function load(uri, callback) {
  return new Promise(function(resolve, reject) {
    var r = new XMLHttpRequest();
    r.open("GET", uri, true);
    r.responseType = "arraybuffer";
    r.onerror = reject;
    r.onload = function() {
      resolve({
        data: r.response,
        callback
      });
    };
    r.send();
  });
}
function decode({ data, callback }) {
  return new Promise(function(resolve, reject) {
    var success = function(buffer) {
      resolve(buffer);
      if (callback) {
        callback(buffer);
      }
    };
    Sound.ctx.decodeAudioData(data, success, reject);
  });
}
var _loop, _volume, _speed, _startTime, _offset, _ended, __create;
var _Sound = class {
  constructor(url, callback, context) {
    __privateAdd(this, _ended);
    __privateAdd(this, _loop, false);
    __privateAdd(this, _volume, 1);
    __privateAdd(this, _speed, 1);
    __privateAdd(this, _startTime, 0);
    __privateAdd(this, _offset, 0);
    __publicField(this, "playing", false);
    __publicField(this, "filter", null);
    __publicField(this, "gain", null);
    __publicField(this, "src", null);
    var scope = this;
    if (context) {
      _Sound.ctx = context;
    } else {
      _Sound.ctx = new Context();
    }
    switch (typeof url) {
      case "string":
        this.src = url;
        load(url, assignBuffer).then(decode);
        break;
      case "object":
        decode({
          data: url,
          callback: assignBuffer
        });
        break;
    }
    function assignBuffer(buffer) {
      scope.buffer = buffer;
      scope.gain = scope.filter = _Sound.ctx.createGain();
      scope.gain.connect(_Sound.ctx.destination);
      scope.gain.gain.value = Math.max(Math.min(__privateGet(scope, _volume), 1), 0);
      if (callback) {
        callback(this);
      }
    }
  }
  applyFilter(node) {
    if (this.filter && this.filter !== this.gain) {
      this.filter.disconnect(this.gain);
    }
    this.filter = node;
    this.gain.connect(this.filter);
    return this;
  }
  play(options) {
    var params = defaults(options || {}, {
      time: _Sound.ctx.currentTime,
      loop: this._loop,
      offset: this._offset,
      duration: this.buffer.duration - this._offset
    });
    if (_Sound.ctx && /suspended/i.test(_Sound.ctx.state)) {
      _Sound.ctx.resume();
    }
    if (this.source) {
      this.stop();
    }
    __privateSet(this, _startTime, params.time);
    __privateSet(this, _loop, params.loop);
    this.playing = true;
    this.source = _Sound.ctx.createBufferSource();
    this.source.onended = __privateMethod(this, _ended, __create);
    this.source.buffer = this.buffer;
    this.source.loop = params.loop;
    this.source.playbackRate.value = __privateGet(this, _speed);
    this.source.connect(this.filter);
    if (this.source.start) {
      this.source.start(params.time, params.offset);
    } else if (this.source.noteOn) {
      this.source.noteOn(params.time, params.offset);
    }
    return this;
  }
  pause(options) {
    if (!this.source || !this.playing) {
      return this;
    }
    var params = defaults(options || {}, {
      time: _Sound.ctx.currentTime
    });
    this.source.onended = identity;
    if (this.source.stop) {
      this.source.stop(params.time);
    } else if (this.source.noteOff) {
      this.source.noteOff(params.time);
    }
    this.playing = false;
    var currentTime = _Sound.ctx.currentTime;
    if (params.time != "undefined") {
      currentTime = params.time;
    }
    __privateSet(this, _offset, currentTime - __privateGet(this, _startTime) + (__privateGet(this, _offset) || 0));
    if (__privateGet(this, _loop)) {
      __privateSet(this, _offset, Math.max(__privateGet(this, _offset), 0) % this.buffer.duration);
    } else {
      __privateSet(this, _offset, Math.min(Math.max(__privateGet(this, _offset), 0), this.buffer.duration));
    }
    return this;
  }
  stop(options) {
    if (!this.source || !this.playing) {
      return this;
    }
    var params = defaults(options || {}, {
      time: _Sound.ctx.currentTime
    });
    this.source.onended = identity;
    if (this.source.stop) {
      this.source.stop(params.time);
    } else if (this.source.noteOff) {
      this.source.noteOff(params.time);
    }
    this.playing = false;
    __privateSet(this, _offset, 0);
    return this;
  }
  get volume() {
    return __privateGet(this, _volume);
  }
  set volume(v) {
    __privateSet(this, _volume, v);
    if (this.gain) {
      this.gain.gain.value = Math.max(Math.min(__privateGet(this, _volume), 1), 0);
    }
  }
  get speed() {
    return __privateGet(this, _speed);
  }
  set speed(s) {
    __privateSet(this, _speed, s);
    if (this.playing) {
      this.play();
    }
  }
  get currentTime() {
    return this.playing ? (_Sound.ctx.currentTime - __privateGet(this, _startTime) + __privateGet(this, _offset)) * __privateGet(this, _speed) : __privateGet(this, _offset);
  }
  set currentTime(t) {
    var time;
    if (!this.buffer) {
      return this;
    }
    if (__privateGet(this, _loop)) {
      time = Math.max(t, 0) % this.buffer.duration;
    } else {
      time = Math.min(Math.max(t, 0), this.buffer.duration);
    }
    __privateSet(this, _offset, time);
    if (this.playing) {
      this.play();
    }
  }
  get millis() {
    return Math.floor(this.currentTime * 1e3);
  }
  get duration() {
    if (!this.buffer) {
      return 0;
    }
    return this.buffer.duration;
  }
};
var Sound = _Sound;
_loop = new WeakMap();
_volume = new WeakMap();
_speed = new WeakMap();
_startTime = new WeakMap();
_offset = new WeakMap();
_ended = new WeakSet();
__create = function() {
  this.playing = false;
};
__publicField(Sound, "has", has);
__publicField(Sound, "ctx", null);

// src/renderer.js
var Renderer = class {
  domElement;
  ctx;
  constructor(width, height) {
    this.domElement = document.createElement("canvas");
    this.domElement.width = width;
    this.domElement.height = height;
    this.ctx = this.domElement.getContext("2d");
    this.children = [];
  }
  get width() {
    return this.domElement.width;
  }
  get height() {
    return this.domElement.height;
  }
  add() {
    for (var i = 0; i < arguments.length; i++) {
      var child = arguments[i];
      var index = this.children.indexOf(child);
      if (index < 0) {
        this.children.push(child);
      } else {
        this.children.splice(index, 1);
        this.children.push(child);
      }
    }
    return this;
  }
  remove() {
    for (var i = 0; i < arguments.length; i++) {
      var child = arguments[i];
      var index = this.children.indexOf(child);
      if (index >= 0) {
        this.children.splice(index, 1);
      }
    }
    return this;
  }
  appendTo(elem) {
    elem.appendChild(this.domElement);
    return this;
  }
  clear() {
    this.ctx.clearRect(0, 0, this.domElement.width, this.domElement.height);
    return this;
  }
  render() {
    for (var i = 0; i < this.children.length; i++) {
      this.children[i].render(this.ctx);
    }
    return this;
  }
};
var Point = class {
  x = 0;
  y = 0;
  value = 0;
  sum = 0;
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
};
var Shape = class {
  fill = "#fff";
  linewidth = 1;
  stroke = "#000";
  opacity = 1;
  updated = false;
  position;
  scale = 1;
  constructor() {
    this.position = new Point();
  }
  noStroke() {
    this.stroke = "transparent";
    return this;
  }
  noFill() {
    this.fill = "transparent";
    return this;
  }
  render(ctx) {
    ctx.save();
    ctx.fillStyle = this.fill;
    ctx.lineWidth = this.linewidth;
    ctx.strokeStyle = this.stroke;
    ctx.globalAlpha = this.opacity;
  }
};
var Line = class extends Shape {
  x1 = 0;
  y1 = 0;
  x2 = 0;
  y2 = 0;
  value = 0;
  constructor(x1, y1, x2, y2) {
    super();
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
  }
  render(ctx) {
    super.render(ctx);
    ctx.beginPath();
    ctx.moveTo(this.x1, this.y1);
    ctx.lineTo(this.x2, this.y2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return this;
  }
};
var Circle = class extends Shape {
  x = 0;
  y = 0;
  r = 0;
  constructor(x, y, r) {
    super();
    this.x = x;
    this.y = y;
    this.r = r;
  }
  render(ctx) {
    super.render(ctx);
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * this.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return this;
  }
};
var Polyline = class extends Shape {
  vertices;
  index = 0;
  constructor(vertices) {
    super();
    this.vertices = vertices;
  }
  render(ctx) {
    super.render(ctx);
    ctx.beginPath();
    for (var i = 0; i < this.vertices.length; i++) {
      var v = this.vertices[i];
      if (i === 0) {
        ctx.moveTo(v.x, v.y);
      } else {
        ctx.lineTo(v.x, v.y);
      }
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
};

// src/styles.js
var colors = {
  "eee": "#eee",
  "ccc": "#ccc",
  "bbb": "#bbb",
  "888": "#888",
  "black": "black",
  "green": "rgb(100, 255, 100)",
  "blue": "rgb(50, 150, 255)",
  "purple": "rgb(150, 50, 255)",
  "pink": "rgb(255, 100, 100)",
  "red": "rgb(255, 50, 50)",
  "orange": "orange",
  "gold": "rgb(255, 150, 50)",
  "white": "white"
};
var styles = {
  font: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    size: 11,
    fill: colors["888"],
    leading: 20,
    weight: 500
  },
  classic: {
    display: "block",
    position: "relative",
    background: "transparent",
    padding: 20 + "px"
  },
  recording: {
    position: "absolute",
    borderRadius: "50%",
    top: 10 + "px",
    left: "50%",
    width: 8 + "px",
    height: 8 + "px",
    marginLeft: -4 + "px",
    marginTop: -4 + "px",
    cursor: "pointer",
    background: colors["ccc"],
    content: ""
  }
};

// src/equalizer.js
var _Equalizer = class {
  analyser;
  domElement;
  nodes;
  renderer;
  bands;
  average;
  constructor(context, width, height, fftSize) {
    this.ctx = context || Sound.ctx;
    this.nodes = [];
    this.analyser = this.ctx.createAnalyser();
    this.analyser.connect(this.ctx.destination);
    this.analyser.fftSize = fftSize || this.analyser.frequencyBinCount;
    this.analyser.data = new Uint8Array(this.analyser.frequencyBinCount);
    this.domElement = document.createElement("div");
    this.domElement.classList.add("equalizer");
    this.renderer = new Renderer(width || 200, height || 100).appendTo(this.domElement);
    extend(this.renderer.domElement.style, styles.classic);
    var vertices = [];
    this.bands = [];
    for (var i = 0; i < _Equalizer.Resolution; i++) {
      var pct = (i + 0.5) / _Equalizer.Resolution;
      var x = pct * this.renderer.width;
      var band = new Line(x, 0, x, 0);
      band.value = 0;
      band.linewidth = this.renderer.width / _Equalizer.Resolution * 0.85;
      band.stroke = colors["bbb"];
      band.noFill();
      band.opacity = 0.5;
      band.peak = new Line(x - band.linewidth / 2, 0, x + band.linewidth / 2, 0);
      band.peak.value = 0;
      band.peak.updated = false;
      band.peak.stroke = colors["888"];
      band.peak.noFill();
      band.peak.linewidth = 2;
      band.beat = new Circle(x, this.renderer.height * 0.125, 2);
      band.beat.noStroke();
      band.beat.fill = colors.blue;
      band.direction = new Line(x - band.linewidth / 2, 0, x + band.linewidth / 2, 0);
      band.direction.value = 0;
      band.direction.stroke = colors.red;
      band.direction.noFill();
      band.direction.linewidth = 2;
      var anchor = new Point(x, 0);
      anchor.sum = 0;
      vertices.push(anchor);
      anchor.outlier = new Circle(0, 0, 1);
      anchor.outlier.noStroke();
      anchor.outlier.fill = colors.purple;
      this.bands.push(band);
    }
    this.average = new Polyline(vertices);
    this.average.stroke = colors.gold;
    this.average.opacity = 0.85;
    this.average.linewidth = 1;
    this.average.noFill();
    this.average.index = 1;
  }
  appendTo(elem) {
    elem.appendChild(this.domElement);
    return this;
  }
  load(path, callback) {
    return new Promise(function(resolve, reject) {
      var scope = this;
      var r = new XMLHttpRequest();
      r.open("GET", path, true);
      r.onerror = reject;
      r.onload = function() {
        var data = JSON.parse(r.response);
        scope.analyzed = data;
        if (callback) {
          callback();
        }
        resolve(scope.analyzed);
      };
      r.send();
    });
  }
  add(node) {
    if (this.nodes.indexOf(node) < 0) {
      this.nodes.push(node);
      node.connect(this.analyser);
    }
    return this;
  }
  remove(node) {
    var index = this.nodes.indexOf(node);
    if (index >= 0) {
      return this.nodes.splice(index, 1);
    }
    return null;
  }
  update(currentTime, silent) {
    if (this.analyzed) {
      var sid = Math.floor(currentTime * this.analyzed.frameRate);
      var sample = this.analyzed.samples[sid];
      if (sample) {
        this.analyser.data = Uint8Array.from(sample);
      } else {
        this.analyzer.data = new Uint8Array(this.analyzed.resolution);
      }
    } else {
      this.analyser.getByteFrequencyData(this.analyser.data);
    }
    var height = this.renderer.height * 0.75;
    var step = this.analyser.data.length / this.bands.length;
    var sum = 0;
    var bin = Math.floor(step);
    this.renderer.clear();
    for (var j = 0, i = 0; j < this.analyser.data.length; j++) {
      var k = mod(Math.floor(j - bin / 2), bin);
      sum += clamp(this.analyser.data[j], 0, 255);
      if (k !== 0) {
        continue;
      }
      var pct = i / this.bands.length;
      var band = this.bands[i];
      var value = band.value;
      var peak = band.peak.value;
      var direction, changedDirection, y, anchor;
      band.value = sum / bin;
      if (band.value > band.peak.value) {
        band.peak.value = band.value;
        band.peak.updated = true;
      } else {
        band.peak.value -= band.peak.value * _Equalizer.Drag;
        band.peak.updated = false;
      }
      direction = band.direction.value;
      band.direction.value = band.peak.value - peak < -_Equalizer.Precision ? -1 : band.peak.value - peak <= _Equalizer.Precision ? 0 : 1;
      changedDirection = direction !== band.direction.value;
      if (changedDirection && band.direction.value > 0) {
        band.beat.scale = 3;
        band.beat.updated = true;
      } else {
        band.beat.scale += (1 - band.beat.scale) * _Equalizer.Drift;
        band.beat.updated = false;
      }
      band.direction.stroke = band.direction.value <= 0 ? colors.pink : colors.green;
      y = this.renderer.height - height * (band.value / _Equalizer.Amplitude);
      band.y1 = this.renderer.height;
      band.y2 = Math.min(y, this.renderer.height - 2);
      y = this.renderer.height - height * (band.peak.value / _Equalizer.Amplitude);
      band.peak.y1 = band.peak.y2 = y;
      anchor = this.average.vertices[i];
      anchor.sum += band.value;
      anchor.value = anchor.sum / this.average.index;
      anchor.y = this.renderer.height - height * anchor.value / _Equalizer.Amplitude;
      if (Math.abs(band.value - anchor.value) > _Equalizer.Amplitude * _Equalizer.Threshold) {
        anchor.outlier.scale = 2;
        anchor.outlier.updated = true;
      } else {
        anchor.outlier.scale += (1 - anchor.outlier.scale) * _Equalizer.Drift;
        anchor.outlier.updated = false;
      }
      band.render(this.renderer.ctx);
      band.peak.render(this.renderer.ctx);
      band.beat.render(this.renderer.ctx);
      band.direction.render(this.renderer.ctx);
      sum = 0;
      i++;
    }
    this.average.render(this.renderer.ctx);
    if (this.analyzed) {
    } else {
      this.analyser.getByteTimeDomainData(this.analyser.data);
    }
    this.average.index++;
    return this;
  }
  reset() {
    for (var i = 0; i < this.average.vertices.length; i++) {
      var anchor = this.average.vertices[i];
      anchor.sum = 0;
      anchor.value = 0;
      anchor.y = this.renderer.height;
    }
    this.average.index = 1;
    return this;
  }
};
var Equalizer = _Equalizer;
__publicField(Equalizer, "Precision", 0);
__publicField(Equalizer, "Resolution", 16);
__publicField(Equalizer, "Drag", 5e-3);
__publicField(Equalizer, "Drift", 0.33);
__publicField(Equalizer, "Amplitude", 255);
__publicField(Equalizer, "Threshold", 0.25);
__publicField(Equalizer, "Sound", Sound);
export {
  Equalizer as default
};
