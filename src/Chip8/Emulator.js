const CHIP8_MEM_SZ = 4 * 1024;

export default class Emulator {
    constructor() {
	this.memory = new Uint8Array(CHIP8_MEM_SZ);
	this.pc = 0;
	this.sp = 0;
    }

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
	const firstBit = (op >> 3) & 1;
	if(firstBit === 0) {
	    // One of: 0NNN, 00E0, or 00EE
	} else if(firstBit === 1) {
	}
    }

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
