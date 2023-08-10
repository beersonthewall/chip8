const CHIP8_MEM_SZ = 4 * 1024;

export default class Interpreter {
    constructor() {
	this.memory = new Uint8Array(CHIP8_MEM_SZ);
	this.registers = new Uint8Array(16);
	this.pc = 0;
	this.sp = 0;
    }

    /**
      Ticks the Chip8 interpreter forward a single instruction.
     */
    tick(ctx) {
	let rgb = 'rgb('+
	    Math.floor(Math.random()*256)+','+
	    Math.floor(Math.random()*256)+','+
	    Math.floor(Math.random()*256)+')';
	ctx.fillStyle = rgb;
	ctx.fillRect(0, 0, 500, 500);
	if(this.pc >= CHIP8_MEM_SZ) {
	    throw new Error("PC out of bounds");
	}

	const op = this.readOpcode();
	const upperNibble = (op >> 12) & 0xf;
	if(upperNibble === 0) {
	    if(op === 0x00E0) {
		// 00E0: Clear display
		const h = ctx.canvas.height;
		const w = ctx.canvas.width;
		ctx.clearRect(0, 0, h, w);
	    } else if(op === 0x00EE) {
		// 00EE: return from subroutine
	    } else {
		// 0NNN: Call machine code routine
	    }
	} else if(upperNibble === 1) {
	    // 1NNN: goto address NNN
	} else if(upperNibble === 2) {
	    // 2NNN: call subroutine at NNN
	} else if(upperNibble === 3) {

	} else if(upperNibble === 4) {

	} else if(upperNibble === 5) {

	} else if(upperNibble === 6) {

	} else if(upperNibble === 7) {

	} else if(upperNibble === 8) {

	} else if(upperNibble === 9) {

	} else if(upperNibble === 0xA) {

	} else if(upperNibble === 0xB) {

	} else if(upperNibble === 0xC) {

	} else if(upperNibble === 0xD) {

	} else if(upperNibble === 0xE) {

	} else if(upperNibble === 0xF) {

	}
    }

    /*
      Reads an opcode from memory at the currect program counter location.
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
