const CHIP8_MEM_SZ = 4 * 1024;
const STACK_SZ = 16;
const SCREEN_HEIGHT = 32;
const SCREEN_WIDTH = 64;

export default class Interpreter {
    constructor() {
	this.memory = new Uint8Array(CHIP8_MEM_SZ);
	// Store the stack separately to avoid collision issues.
	// unclear if there's a standard memory map that programs
	// would know to avoid overwriting. Perhaps the 'low memory'
	// below 0x200?
	this.stack = new Uint8Array(STACK_SZ);
	this.registers = new Uint8Array(16);
	this.pc = 0x200;
	this.sp = 0;
	this.delay_timer = 0;
	this.sound_timer = 0;
	this.input = new Input();
	this.screen = this._screen();
	this.scale = 1;
	this.waitingForKeyPress = false;
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

    reset(ctx) {
	let canvas = ctx.canvas;
	let height = ctx.canvas.height;
	let width = ctx.canvas.width;
	let y_scale = Math.floor(height / SCREEN_HEIGHT);
	let x_scale = Math.floor(width / SCREEN_WIDTH);
	console.assert(y_scale, x_scale);
	this.scale = x_scale;
	this.memory = new Uint8Array(CHIP8_MEM_SZ);
	this.pc = 0;
	this.sp = 0;
	this.I = 0;
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, width, height);
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
	if(this.pc >= CHIP8_MEM_SZ) {
	    throw new Error("PC out of bounds");
	}

	if(this.waitingForKeyPress && !this.input.pollKey()) {
	    return;
	} else if(this.waitingForKeyPress && this.input.pollKey()) {
	    // dec pc to retrieve wait key instruction
	    this.pc -= 2;
	    let op = this.readOpcode();
	    this._storeKey(op, this.input.key());
	    this.waitingForKeyPress = false;
	}

	const op = this.readOpcode();
	console.log(op);
	const upperNibble = (op >> 12) & 0xf;
	switch(upperNibble) {
	case 0x0: {
	    if(op === 0x00E0) {
		// 00E0: Clear display
		const h = ctx.canvas.height;
		const w = ctx.canvas.width;
		ctx.clearRect(0, 0, h, w);
	    } else if(op === 0x00EE) {
		// 00EE: return from subroutine
		this.sp -= 1;
		if(this.sp < 0 || this.sp > STACK_SZ) {
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
	    this.registers[x] = op;
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
		if(255 - this.registers[y] < x) {
		    this.registers[0xF] = 1;
		} else {
		    this.registers[0xF] = 0;
		}
		this.registers[x] += this.registers[y];
	    } else if(lsn === 5) {
		// 8XY5
		this.registers[x] -= this.registers[y];
	    } else if(lsn === 6) {
		// 8XY6
		this.registers[0xF] = this.registers[x] & 1;
		this.registers[x] >>= 1;
	    } else if(lsn === 7) {
		// 8XY7
		this.registers[x] = this.registers[y] - this.registers[x];
	    } else if(lsn === 0xE) {
		// 8XYE
		this.registers[x] <<= 1
	    }
	    break;
	}
	case 0x9: {
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
		if(this.registers[x] === this.input.pollKey()) {
		    this.pc += 2;
		}
	    } else if(lower === 0xA1) {
		// EXA1: skip next instruction if key in Vx is not pressed
		let x = (op >> 8) & 0xF;
		if(this.registers[x] !== this.input.pollKey()) {
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
		if(this.input.pollKey()) {
		    this._storeKey(op, this.input.key());
		} else {
		    this.waitingForKeyPress = true;
		}
	    } else if(lower === 0x15) {
		// FX15: Timer
		this.delay_timer = this.registers[x];
	    } else if(lower === 0x18) {
		// FX18: Sound
		this.sound_timer = this.registers[x];
	    } else if(lower === 0x1E) {
		// FX1E
		this.i += this.registers[x];
	    } else if(lower === 0x29) {
		// FX29: MEM
	    } else if(lower === 0x33) {
		// FX33: BCD - binary coded decimal
		let x = (op >> 8) & 0xF;
		let num = this.registers[x];
		let addr = this.I + 2;
		while(num && addr != this.I) {
		    this.memory[addr] = num % 10;
		    num = Math.floor(num / 10);
		    addr -= 1;
		}
	    } else if(lower === 0x55) {
		// FX55: dump registers to memory
		let addr = this.I;
		for(let i = 0; i < 0xF; i++) {
		    this.memory[addr] = this.registers[i];
		    addr += 1;
		}		
	    } else if(lower === 0x65) {
		// FX65: load registers from memory
		let addr = this.I;
		for(let i = 0; i < 0xF; i++) {
		    this.registers[i] = this.memory[addr];
		    addr += 1;
		}
	    }
	    break;
	}
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

const keys = ['1', '2', '3', 'q', 'w', 'e', 'a', 's', 'd', 'z', 'x', 'c'];

class Input {
    constructor() {
	this.keyPressed = undefined;
	document.addEventListener('keydown', (e) => {
	    let index = keys.indexOf(e.key);
	    if(index > -1)
		this.keyPressed = index;
	});
	document.addEventListener('keyup', (e) => {
	    this.keyPressed = undefined;
	});
    }

    key() {
	let key = this.keyPressed;
	this.keyPressed = undefined;
	return key;
    }

    pollKey() {
	return this.keyPressed;
    }
}
