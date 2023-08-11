import React, { useEffect, useRef, useState } from 'react';
import Interpreter from './Interpreter';
import './Game.css';
import Controls from './Controls';

let interp = new Interpreter();

export default function Game({ height, width }) {
    const canvasRef = useRef(null);

    const keydown = (e) => {
	interp.pressKey(e.key);
	e.preventDefault();
    };
    const keyup = (e) => {
	interp.liftKey(e.key);
	e.preventDefault();
    };

    document.addEventListener('keydown', keydown);
    document.addEventListener('keyup', keyup);
    
    useEffect(() => {
	const ctx = canvasRef.current?.getContext("2d");
	if(ctx != null) {
	    const frameTime = 1000/60;
	    let last = Date.now();
	    let origin = last + frameTime/2;
	    setInterval(_ => {
		last += (Date.now()-last);
		if(interp.hlt) return;
		for(let k = 0; origin < last-frameTime && k < 2; origin+=frameTime,k++) {
		    let tickrate = 7;
		    for(let z = 0; z < tickrate && !interp.waiting; z++) {
			interp.tick(ctx);
		    }
		    interp.timerTick();
		}
	    }, frameTime);
	}
    });

    function loadProgram(e) {
	e.preventDefault();
	let file = e.target.file.files[0];
	let reader = new FileReader();
	reader.onload = () => {
	    const ctx = canvasRef.current?.getContext("2d");
	    if(ctx) {
		interp.reset(ctx);
	    }
	    interp.loadProgram(new Uint8Array(reader.result));
	};
	reader.readAsArrayBuffer(file);
    }

    function reset(e) {
	e.preventDefault();
	const ctx = canvasRef.current?.getContext("2d");
	interp.reset(ctx);
    }

    return (
	<>
	    <canvas className="screen"
		    width={ width }
		    height={ height }
		    ref={canvasRef}
	    ></canvas>
	    <Controls loadProgram={(e) => loadProgram(e)} reset={(e) => reset(e) }/>
	</>
    );
}
