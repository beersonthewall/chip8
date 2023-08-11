import React, { useEffect, useRef, useState } from 'react';
import Interpreter from './Interpreter';
import './Game.css';
import Controls from './Controls';

let interp = new Interpreter();

export default function Game({ height, width }) {
    const canvasRef = useRef(null);

    useEffect(() => {
	const ctx = canvasRef.current?.getContext("2d");
	if(ctx != null) {
	    const delay = Math.round(16);
	    const interval = setInterval(() => {
		interp.tick(ctx);
	    }, delay);

	    return () => clearInterval(interval);
	}
    });

    function loadProgram(e) {
	e.preventDefault();
	let file = e.target.file.files[0];
	let reader = new FileReader();
	reader.onload = () => {
	    const ctx = canvasRef.current?.getContext("2d");
	    console.log("lad");
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
