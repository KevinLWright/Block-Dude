var downkey = -1;
var keyitrv;

var state = {};

function isMobile() {
	if (navigator.userAgent.match(/Mobile\//)) return true;
	return false;
}

function isSafari() {
	if (navigator.userAgent.match(/Safari/i)) return true;
	return false;
}

function createGame(containers) {
	state.panning = false;
	state.levels = BLOCK_LEVELS;
	if (isMobile()) {
		state.ifaces = [new Interface(null, 18, 10), new Interface(null, 12, 6)];
	} else {
		state.ifaces = [new Interface(null, 18, 12)];
	}
	for (var i = 0; i < state.ifaces.length && i < containers.length; i++) {
		state.ifaces[i].render(containers[i]);
	}
	processHash();
	//setLevel(0);
}

function processHash() {
	var pass = window.location.hash;
	if (pass.charCodeAt(0) == 35) {
		pass = pass.substring(1);
	}
	if (!pass && window.location.pathname) {
		if (window.location.pathname.length == 14) {
			if (window.location.pathname.substr(0, 11) == "/blockdude/") {
				pass = window.location.pathname.substr(11);
			}
		}
	}
	setLevel(BLOCK_RHASHES[pass] || 0);
}

function setLevel(level) {
	if (!level) level = 0;
	var lvl = makeLevel(state.levels[level]);
	state.level = level;
	state.dude = lvl.dude;
	state.env = lvl.env;
	for (var i = 0; i < state.ifaces.length; i++) {
		state.ifaces[i].setEnvironment(state.env);
		state.ifaces[i].setCenter(state.dude);
		state.ifaces[i].update();
	}
	if (level != 0 && BLOCK_HASHES[level]) {
		if (window.location.hash != '#' + BLOCK_HASHES[level]) window.location.hash = '#' + BLOCK_HASHES[level];
		if (document.getElementById("blockPass")) document.getElementById("blockPass").value = BLOCK_HASHES[level];
	} else {
		if (window.location.hash != '#' && window.location.hash != '') window.location.hash = '';
		if (document.getElementById("blockPass")) document.getElementById("blockPass").value = '';
	}
}

function nextLevel() {
	if (!state) return;
	state.completed = (state.completed || 0) + 1;
	if ((state.level || 0) + 1 >= state.levels.length) return;
	setLevel((state.level || 0) + 1);
}

function makeLevel(str) {
	var elems = new Array();
	var rows = str.split("\n");
	var mcols = 0;
	for (var r = 0; r < rows.length; r++) {
		if (rows[r].length > mcols) {
			mcols = rows[r].length;
		}
	}
	var env = new Environment(mcols, rows.length);
	var dude;
	for (var r = 0; r < rows.length; r++) {
		var y = rows.length - r - 1;
		var chars = rows[r].split("");
		for (var x = 0; x < chars.length; x++) {
			var o;
			if (chars[x] == '#') {
				o = new Brick(env, x, y);
			} else if (chars[x] == 'U' || chars[x] == 'u') {
				if (!dude) {
					dude = new Dude(env, x, y, (chars[x] == 'U'));
					o = dude;
				}
			} else if (chars[x] == 'B') {
				o = new Block(env, x, y);
			} else if (chars[x] == 'D') {
				o = new Door(env, x, y);
			}
			if (o) elems[elems.length] = o;
		}
	}
	return {
		'env': env,
		'elements': elems,
		'dude': dude
	};
}

function step() {
	if (downkey < 0) {
		clearInterval(keyitrv);
		return;
	}
	var targets = state.panning ? state.ifaces : [state.dude];
	for (var i = 0; i < targets.length; i++) {
		var target = targets[i];
		if (downkey == 37) {
			target.left();
		} else if (downkey == 38) {
			target.up();
		} else if (downkey == 39) {
			target.right();
		} else if (downkey == 40) {
			target.down();
		} else if (downkey == 82) {
			setLevel(state.level || 0);
		}
	}
}

function stepleft() {
	var targets = state.panning ? state.ifaces : [state.dude];
	for (var i = 0; i < targets.length; i++) {
		var target = targets[i];
		target.left();
	}
}

function stepright() {
	var targets = state.panning ? state.ifaces : [state.dude];
	for (var i = 0; i < targets.length; i++) {
		var target = targets[i];
		target.right();
	}
}

function stepup() {
	var targets = state.panning ? state.ifaces : [state.dude];
	for (var i = 0; i < targets.length; i++) {
		var target = targets[i];
		target.up();
	}
}

function restartLvl() {
	setLevel(state.level || 0);
}

function stepdown() {
	var targets = state.panning ? state.ifaces : [state.dude];
	for (var i = 0; i < targets.length; i++) {
		var target = targets[i];
		target.down();
	}
}


function myFunction() {
	var checkBox = document.getElementById("light-switch");
	if (checkBox.checked == true) {
		state.panning = true;
		return;
		downkey = (e.keyCode || e.charCode || -1);
		step();
		clearInterval(keyitrv);
		keyitrv = setInterval(step, 200);
	} else {
		state.panning = false;
		for (var i = 0; i < state.ifaces.length; i++) state.ifaces[i].center();
		return;
		downkey = -1;
		clearInterval(keyitrv);
	}
}


function Interface(env, w, h, cw, ch) {
	this.env = env;
	this.w = w || 0;
	this.h = h || 0;
	this.cw = cw || 20;
	this.ch = ch || 20;
	this.env = env;
	this.pan = null;
	this.centerOn = null;
	this.panning = false;
	this.iid = 'int' + Math.random();
	this.imgroot = 'images/';
	this.images = {
		'empty': 'empty',
		'dudeLeft': 'dudeLeft',
		'dudeRight': 'dudeRight',
		'block': 'block',
		'brick': 'brick',
		'door': 'door'
	};
	this.grid = new Array();
	this._init = function () {
		this.setEnvironment(this.env);
		for (var y = 0; y < this.h; y++) {
			var yy = this.h - y - 1;
			this.grid[y] = new Array();
			for (var x = 0; x < this.w; x++) {
				this.grid[y][x] = document.createElement('img');
				this.grid[y][x].src = this.getImg('empty');
				this.grid[y][x].height = this.ch;
				this.grid[y][x].width = this.cw;
				this.grid[y][x].id = this.iid + '.' + y + '.' + x; //Necessary?
				this.grid[y][x].className = 'blockcell';
				this.grid[y][x].style.top = "" + (yy * this.ch) + "px";
				this.grid[y][x].style.left = "" + (x * this.cw) + "px";
				this.grid[y][x].style.width = "" + this.cw + "px";
				this.grid[y][x].style.height = "" + this.ch + "px";
			}
		}
		this.preload();
	}
	this.preload = function () {
		for (var k in this.images) {
			(new Image()).src = this.getImg(k);
		}
	}
	this.getImg = function (k) {
		return this.imgroot + this.images[k] + (isSafari() ? '.png' : (isIE() ? '.gif' : '.png')); //Would be PDF for Safari
	}
	this.render = function (c) {
		if (!c) c = document.body;
		for (var y = 0; y < this.h; y++) {
			for (var x = 0; x < this.w; x++) {
				c.appendChild(this.grid[y][x]);
			}
		}
		c.style.width = "" + (this.w * this.cw) + "px";
		c.style.height = "" + (this.h * this.ch) + "px";
	}
	this.setEnvironment = function (env) {
		if (!env) return;
		this.env = env;
		this.env.addInterface(this);
	}
	this.setCenter = function (o) {
		this.centerOn = o;
	}
	this.getCenter = function () {
		if (!this.centerOn) return {
			'x': 0,
			'y': 0
		};
		return this.centerOn;
	}
	this.left = function () {
		if (!this.pan) return;
		this.panning = true;
		this.pan.x -= 1;
		this.update();
	}
	this.right = function () {
		if (!this.pan) return;
		this.panning = true;
		this.pan.x += 1;
		this.update();
	}
	this.up = function () {
		if (!this.pan) return;
		this.panning = true;
		this.pan.y += 1;
		this.update();
	}
	this.down = function () {
		if (!this.pan) return;
		this.panning = true;
		this.pan.y -= 1;
		this.update();
	}
	this.center = function () {
		this.panning = false;
		this.update();
	}
	this.update = function () {
		var c = this.getCenter();
		if (!this.pan || !this.panning) this.pan = {
			'x': c.x - this.w / 2.0,
			'y': c.y - this.h / 2.0
		};
		if (Math.ceil(this.pan.x + this.w) > this.env.w) this.pan.x = this.env.w - this.w;
		if (Math.ceil(this.pan.y + this.h) > this.env.h) this.pan.y = this.env.h - this.h;
		if (Math.floor(this.pan.x) < 0) this.pan.x = 0;
		if (Math.floor(this.pan.y) < 0) this.pan.y = 0;
		this.pan.x = Math.floor(this.pan.x);
		this.pan.y = Math.floor(this.pan.y);
		for (var y = 0; y < this.h; y++) {
			for (var x = 0; x < this.w; x++) {
				var obj = this.env.get(x + this.pan.x, y + this.pan.y);
				if (!obj) {
					this.grid[y][x].src = this.getImg('empty');
				} else if (obj.type == 'brick') {
					this.grid[y][x].src = this.getImg('brick');
				} else if (obj.type == 'block') {
					this.grid[y][x].src = this.getImg('block');
				} else if (obj.type == 'door') {
					this.grid[y][x].src = this.getImg('door');
				} else if (obj.type == 'dude') {
					this.grid[y][x].src = this.getImg('dude' + (obj.facing ? 'Right' : 'Left'));
				} else {
					this.grid[y][x].src = this.imgroot + this.getImg('empty');
				}
			}
		}
	}
	this._init();
}

function Environment(w, h) {
	this.w = w || 0;
	this.h = h || 0;
	this.ifaces = new Array();
	this.grid = new Array();
	for (var y = 0; y < this.w; y++) {
		this.grid[y] = new Array();
		for (var x = 0; x < this.h; x++) {
			this.grid[y][x] = null;
		}
	}
	this.addInterface = function (o) {
		this.ifaces[this.ifaces.length] = o;
	}
	this.valid = function (x, y) {
		if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
		return true;
	}
	this.get = function (x, y) {
		if (!this.valid(x, y)) return null;
		return this.grid[y][x];
	}
	this.addElement = function (e) {
		var x = e.x || 0;
		var y = e.y || 0;
		if (!this.valid(x, y)) return null;
		this.grid[y][x] = e;
		return {
			'x': x,
			'y': y
		};
	}
	this.moveElement = function (r, e) {
		var ox = r.x || 0;
		var oy = r.y || 0;
		var x = e.x || 0;
		var y = e.y || 0;
		this.grid[oy][ox] = null;
		this.grid[y][x] = e;
		r.x = x;
		r.y = y;
	}
	this.update = function () {
		for (var i = 0; i < this.ifaces.length; i++) {
			if (this.ifaces[i] && this.ifaces[i].update) {
				this.ifaces[i].update();
			}
		}
	}
}

Function.prototype.inherits = function (o) {
	if (o.constructor == Function) {
		this.prototype = new o;
		this.prototype.constructor = this;
		this.prototype.parent = o.prototype;
	} else {
		this.prototype = o;
		this.prototype.constructor = this;
		this.prototype.parent = o;
	}
}

function Element() {
	this._element = function () {
		this.x = this.x || 0;
		this.y = this.y || 0;
		this.type = this.type || 'element';
		this.ref = this.env.addElement(this);
	}
	this._redraw = function () {
		this.env.update();
	}
	this._push = function () {
		return false;
	}
	this._fall = function () {
		while (this.env.valid(this.x, this.y - 1) && !this.env.get(this.x, this.y - 1)) {
			this._moveTo(this.x, this.y - 1);
		}
		if (this.env.get(this.x, this.y - 1)) this.env.get(this.x, this.y - 1)._push();
	}
	this._moveTo = function (x, y) {
		this.x = x;
		this.y = y;
		this.env.moveElement(this.ref, this);
	}
}

function Brick(env, x, y) {
	if (!env) return;
	this.env = env;
	this.x = x;
	this.y = y;
	this.type = 'brick';
	this._element();
}
Brick.inherits(Element);

function Block(env, x, y) {
	if (!env) return;
	this.env = env;
	this.x = x;
	this.y = y;
	this.type = 'block';
	this._element();
}
Block.inherits(Element);

function Door(env, x, y) {
	if (!env) return;
	this.env = env;
	this.x = x;
	this.y = y;
	this.type = 'door';
	this._element();
}
Door.inherits(Element);
Door.prototype._push = function () {
	nextLevel();
}

function Dude(env, x, y, face) {
	if (!env) return;
	this.env = env;
	this.x = x;
	this.y = y;
	this.type = 'dude';
	this.facing = !(!face); //facing right
	this.carry = null;
	this._element();
}
Dude.inherits(Element);
Dude.prototype.right = function () {
	this.facing = true;
	this._walkTo(this.x + 1, this.y);
};
Dude.prototype.left = function () {
	this.facing = false;
	this._walkTo(this.x - 1, this.y);
};
Dude.prototype.up = function () {
	var dx = (this.facing ? 1 : -1);
	if (this.env.get(this.x + dx, this.y) && (!this.env.get(this.x, this.y + 1) || this.env.get(this.x, this.y + 1) == this.carry) && (!this.carry || !this.env.get(this.x + dx, this.y + 2))) {
		this._walkTo(this.x + dx, this.y + 1);
	}
};
Dude.prototype.down = function () {
	var dx = (this.facing ? 1 : -1);
	if (this.carry) {
		if (this.env.valid(this.x + dx, this.y + 1) && !this.env.get(this.x + dx, this.y + 1)) {
			this.carry._moveTo(this.x + dx, this.y + 1);
			this.carry._fall();
			this.carry = null;
		}
	} else {
		if (this.env.get(this.x + dx, this.y) && !this.env.get(this.x + dx, this.y + 1) && !this.env.get(this.x, this.y + 1)) {
			var obj = this.env.get(this.x + dx, this.y);
			if (obj.type == 'block') {
				this.carry = obj;
				this.carry._moveTo(this.x, this.y + 1);
				this.carry._fall();
			}
		}
	}
	this._redraw();
	if (this.carry) this.carry._redraw();
};
Dude.prototype._walkTo = function (x, y) {
	if (this.env.valid(x, y)) {
		if (!this.env.get(x, y)) {
			this._moveTo(x, y);
			this._fall();
			if (this.carry) {
				if (this.env.valid(x, y + 1) && !this.env.get(x, y + 1)) {
					this.carry._moveTo(x, y + 1);
					this.carry._fall();
				} else {
					this.carry._fall();
					this.carry = null;
				}
			}
		} else {
			this.env.get(x, y)._push();
		}
	}
	this._redraw();
	if (this.carry) this.carry._redraw();
};

document.onkeydown = keydown;
document.onkeyup = keyup;
document.ontouchstart = touchstart;
document.ontouchmove = touchmove;
document.ontouchend = touchend;
document.ongesturestart = function (e) {
	e.preventDefault();
};
document.ongesturechange = function (e) {
	e.preventDefault();
};
document.ongestureend = function (e) {
	e.preventDefault();
};
window.onorientationchange = windowRotated;
