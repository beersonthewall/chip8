const CHIP8_MEM_SZ = 4 * 1024;
const STACK_SZ = 16;
const SCREEN_HEIGHT = 32;
const SCREEN_WIDTH = 64;
const DEBUG = false;

const keyIndex = {
    '1': 0,
    '2': 1,
    '3': 2,
    '4': 3,
    'q': 4,
    'w': 5,
    'e': 6,
    'r': 7,
    'a': 8,
    's': 9,
    'd': 10,
    'f': 11,
    'z': 12,
    'x': 13,
    'c': 14,
    'v': 15,
};

export default class Interpreter {
    constructor() {
	this.memory = new Uint8Array(CHIP8_MEM_SZ);
	// Store the stack separately to avoid collision issues.
	// unclear if there's a standard memory map that programs
	// would know to avoid overwriting. Perhaps the 'low memory'
	// below 0x200?
	this.stack = new Uint16Array(STACK_SZ);
	this.registers = new Uint8Array(16);
	this.pc = 0x200;
	this.sp = 0;
	this.delay_timer = 0;
	this.sound_timer = 0;
	this.screen = this._screen();
	this.scale = 1;
	this.hlt = false;
	this.I = 0;
	this.keymap = {
	    '1': false,
	    '2': false,
	    '3': false,
	    '4': false,
	    'q': false,
	    'w': false,
	    'e': false,
	    'r': false,
	    'a': false,
	    's': false,
	    'd': false,
	    'f': false,
	    'z': false,
	    'x': false,
	    'c': false,
	    'v': false,
	};
	this.waiting = null;
    }

    timerTick() {
	if(this.delay_timer > 0) {
	    this.delay_timer -= 1;
	}
	if(this.sound_timer > 0) {
	    this.sound_timer -= 1;
	    // TODO make sound
	}
    }

    _screen() {
	let screen = [];
	for(let i = 0; i < SCREEN_WIDTH; i++) {
	    screen.push([]);
	    for(let j = 0; j < SCREEN_HEIGHT; j++) {
		screen[i].push(0);
	    }
	}
	return screen;
    }

    loadProgram(bytes) {
	if(bytes.length < CHIP8_MEM_SZ - 0x200) {
	    for(let i = 0; i < bytes.length; i++) {
		this.memory[i + 0x200] = bytes[i];
	    }
	}
	this.pc = 0x200;
    }

    pressKey(key) {
	if(key in this.keymap) {
	    this.keymap[key] = true;
	}
    }

    liftKey(key) {
	if(key in this.keymap) {
	    this.keymap[key] = false;
	    if(this.waiting) {
		this.registers[this.waiting] = keyIndex[key];
		this.waiting = null;
	    }
	}
    }

    reset(ctx) {
	let canvas = ctx.canvas;
	let height = ctx.canvas.height;
	let width = ctx.canvas.width;
	let y_scale = Math.floor(height / SCREEN_HEIGHT);
	let x_scale = Math.floor(width / SCREEN_WIDTH);
	console.assert(y_scale, x_scale);
	this.scale = x_scale;
	this.memory = new Uint8Array(CHIP8_MEM_SZ);
	this.registers = new Uint8Array(16);
	this.screen = this._screen();
	this.pc = 0x200;
	this.sp = 0;
	this.I = 0;
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, width, height);
	this.debug_line = "";
	this.keymap = {
	    '1': false,
	    '2': false,
	    '3': false,
	    '4': false,
	    'q': false,
	    'w': false,
	    'e': false,
	    'r': false,
	    'a': false,
	    's': false,
	    'd': false,
	    'f': false,
	    'z': false,
	    'x': false,
	    'c': false,
	    'v': false,
	};
	this.waiting = null;
    }

    _storeKey(opcode, key) {
	let x = (opcode >> 8) & 0xF;
	this.registers[x] = key;
    }

    /**
       Ticks the Chip8 interpreter forward a single instruction.

       ctx - CanvasRenderingContext2D, used for drawing to the html canvas
     */
    tick(ctx) {
	if(this.hlt) return;
	if(this.pc >= CHIP8_MEM_SZ) {
	    this.hlt = true;
	    throw new Error("PC out of bounds");
	}

	const op = this.readOpcode();
	const upperNibble = (op >> 12) & 0xf;
	switch(upperNibble) {
	case 0x0: {
	    if(op === 0x00E0) {
		// 00E0: Clear display
		const h = ctx.canvas.height;
		const w = ctx.canvas.width;
		ctx.clearRect(0, 0, h * this.scale, w * this.scale);
		this.screen = this._screen();
	    } else if(op === 0x00EE) {
		// 00EE: return from subroutine
		this.sp -= 1;
		if(this.sp < 0 || this.sp >= STACK_SZ) {
		    this.htl = true;
		    throw new Error("Stack overflow/underflow");
		}
		this.pc = this.stack[this.sp];
	    } else {
		// 0NNN: Call machine code routine
		this.stack[this.sp] = this.pc;
		this.sp += 1;
		this.pc = op & 0xFFF;
	    }
	    break;
	}
	case 0x1:
	    // 1NNN: goto address NNN
	    this.pc = op & 0xFFF;
	    break;
	case 0x2:
	    // 2NNN: call subroutine at NNN
	    this.stack[this.sp] = this.pc;
	    this.sp += 1;
	    this.pc = op & 0xFFF;
	    break;
	case 0x3: {
	    // 3XNN: skip next instruction if eq
	    let reg_offset = (op >> 8) & 0xF;
	    let nn = op & 0xFF;
	    if(this.registers[reg_offset] === nn){
		this.pc += 2;
	    }
	    break;
	}
	case 0x4: {
	    // 4XNN: skip next instruction if not eq
	    let reg_offset = (op >> 8) & 0xF;
	    let nn = op & 0xFF;
	    if(this.registers[reg_offset] !== nn){
		this.pc += 2;
	    }
	    break;
	}
	case 0x5: {
	    // 5XY0: skip next instruction if reg x == reg y
	    let x = (op >> 8) & 0xF;
	    let y = (op >> 4) & 0xF;
	    if(this.registers[x] === this.registers[y]) {
		this.pc += 2;
	    }
	}
	case 0x6: {
	    // 6XNN: set Vx = NN
	    let x = (op >> 8) & 0xF;
	    let nn = op & 0xFF;
	    this.registers[x] = nn;
	    break;
	}
	case 0x7: {
	    // 7XNN: Vx += NN
	    let x = (op >> 8) & 0xF;
	    let nn = op & 0xFF;
	    this.registers[x] += nn;
	    break;
	}
	case 0x8: {
	    let lsn = op & 0xF;
	    let x = (op >> 8) & 0xF;
	    let y = (op >> 4) & 0xF;
	    if(lsn === 0) {
		// 8XY0: assign Vx = Vy
		this.registers[x] = this.registers[y];
	    } else if(lsn === 1) {
		// 8XY1: Vx |= Vy
		this.registers[x] |= this.registers[y];
	    } else if(lsn === 2) {
		// 8XY2
		this.registers[x] &= this.registers[y];
	    } else if(lsn === 3) {
		// 8XY3
		this.registers[x] ^= this.registers[y];
	    } else if(lsn === 4) {
		// 8XY4
		let vf = this.registers[y] + this.registers[x] > 0xFF ? 1 : 0;
		this.registers[x] += this.registers[y];
		this.registers[0xF] = vf;
	    } else if(lsn === 5) {
		// 8XY5
		let vf = this.registers[x] > this.registers[y] ? 1 : 0;
		this.registers[x] -= this.registers[y];
		this.registers[0xF] = vf;
	    } else if(lsn === 6) {
		// 8XY6
		let vf = this.registers[x] & 1;
		this.registers[x] >>= 1;
		this.registers[0xF] = vf;
	    } else if(lsn === 7) {
		// 8XY7
		let vf = this.registers[x] > this.registers[y] ? 0 : 1;
		this.registers[x] = this.registers[y] - this.registers[x];
		this.registers[0xF] = vf;
	    } else if(lsn === 0xE) {
		// 8XYE
		let vf = this.registers[x] >> 7;
		this.registers[x] <<= 1
		this.registers[0xF] = vf;
	    }
	    break;
	}
	case 0x9: {
	    // 9XY0
	    let lsn = op & 0xF;
	    console.assert(0, lsn);

	    let x = (op >> 8) & 0xF;
	    let y = (op >> 4) & 0xF;
	    if(this.registers[x] !== this.registers[y]) {
		this.pc += 2;
	    }
	    break;
	}
	case 0xA: {
	    // ANNN: set I = NNN
	    let addr = op & 0xFFF;
	    this.I = addr;
	    break;
	}
	case 0xB: {
	    // BNNN: jump to V0 + NNN
	    let addr = op & 0xFFF;
	    this.pc = this.registers[0] + addr;
	    break;
	}
	case 0xC: {
	    //CXNN: Vx = nn & rand()
	    let nn = op & 0xFF;
	    let x = (op >> 8) & 0xF;
	    this.registers[x] = Math.floor(Math.random() * 255) & nn;
	    break;
	}
	case 0xD: {
	    // DXYN: draw(Vx, Vy, N)
	    let addr = this.I;
	    let height = op & 0xF;
	    let start_x = this.registers[(op >> 8) & 0xF];
	    let start_y = this.registers[(op >> 4) & 0xF];
	    this.registers[0xF] = 0;

	    for(let i = 0; i < height; i++) {
		let line = this.memory[addr + i];
		for(let j = 0; j < 8; j++) {
		    let value = line & (1 << (7 - j)) ? 1 : 0;
		    if(this._drawPixel(start_x + j, start_y + i, value, ctx)) {
			this.registers[0xF] = 1;
		    }
		}
	    }
	    break;
	}
	case 0xE: {
	    let lower = op & 0xFF;
	    if(lower === 0x9E) {
		// EX9E: skip next instruction if key in Vx is pressed
		let x = (op >> 8) & 0xF;
		if(this.keymap[this.registers[x]]) {
		    this.pc += 2;
		}
	    } else if(lower === 0xA1) {
		// EXA1: skip next instruction if key in Vx is not pressed
		let x = (op >> 8) & 0xF;
		if(!this.keymap[this.registers[x]]) {
		    this.pc += 2;
		}
	    }
	    break;
	}
	case 0xF: {
	    let lower = op & 0xFF;
	    let x = (op >> 8) & 0xF;
	    if(lower === 0x07) {
		this.registers[x] = this.delay_timer;
	    } else if(lower === 0x0A) {
		// FX0A: block for key press
		this.waiting = x;
	    } else if(lower === 0x15) {
		// FX15: Timer
		this.delay_timer = this.registers[x];
	    } else if(lower === 0x18) {
		// FX18: Sound
		this.sound_timer = this.registers[x];
	    } else if(lower === 0x1E) {
		// FX1E
		this.I += this.registers[x];
	    } else if(lower === 0x29) {
		// FX29: MEM
		this.I = this.registers[x] * 5;
	    } else if(lower === 0x33) {
		// FX33: BCD - binary coded decimal
		if(this.I > 4093) {
		    this.hlt = true;
		    throw new Error("BCD I out of bounds");
		}

		let x = (op >> 8) & 0xF;
		let num = this.registers[x];
		const a = Math.floor(num / 100);
		num = num - a * 100;
		const b = Math.floor(num / 10);
		num = num - b * 10;
		const c = Math.floor(num);

		this.memory[this.I] = a;
		this.memory[this.I + 1] = b;
		this.memory[this.I + 2] = c;

	    } else if(lower === 0x55) {
		// FX55: dump registers to memory
		if(this.I > 4095 - x) {
		    this.htl = true;
		    throw new Error("load reg memory out of bounds");
		}
		for(let i = 0; i <= x; i++) {
		    this.memory[this.I + i] = this.registers[i];
		}
		this.I += (x + 1);
	    } else if(lower === 0x65) {
		// FX65: load registers from memory
		if(this.I > 4095 - x) {
		    this.htl = true;
		    throw new Error("load reg memory out of bounds");
		}

		for(let i = 0; i <= x; i++) {
		    this.registers[i] = this.memory[this.I + i];
		}
		this.I += (x + 1);
	    }
	    break;
	}
	default:
	    this.htl = true;
	    throw new Error("Illegal instruction");
	    break;
	}

	this._logDebugMsg(op);
    }

    _logDebugMsg(op) {
	if(DEBUG) {
	    let registers = "";
	    for(let i = 0; i <= 0xF; i++) {
		registers += `V${i.toString(16)}: ${this.registers[i].toString(16)} `
	    }
	    let key = this.input.pollKey() ? this.input.pollKey() : "n/a";
	    console.log(`0x${op.toString(16)} pc: ${this.pc.toString(16)}, sp: ${this.sp.toString(16)} I: ${this.I.toString(16)}, ${registers}, kp: ${key}`);
	    this.debug_line = "";
	}
    }

    _dbg(msg) {
	if(DEBUG) {
	    this.debug_line += msg;
	}
    }

    _drawPixel(x, y, value, ctx) {
	const collision = this.screen[y][x] & value;
	this.screen[y][x] ^= value;

	if(this.screen[y][x]) {
	    ctx.fillStyle = 'white';
	    ctx.fillRect(
		x * this.scale,
		y * this.scale,
		this.scale,
		this.scale
	    );
	} else {
	    ctx.fillStyle = 'black';
	    ctx.fillRect(
		x * this.scale,
		y * this.scale,
		this.scale,
		this.scale,
	    );
	}

	return collision;
    }

    /*
      Reads an opcode from memory at the current program counter location.
      Chip8 instructions are two bytes long so we increment the program
      counter by two.
     */
    readOpcode() {
	if(this.pc >= CHIP8_MEM_SZ || this.pc + 1 >= CHIP8_MEM_SZ) {
	    throw new Error("program counter out of bounds");
	}

	const msb = this.memory[this.pc];
	const lsb = this.memory[this.pc + 1];
	this.pc += 2;
	return (msb << 8) | lsb;
    }
}
