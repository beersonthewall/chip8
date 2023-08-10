import React, { useEffect, useRef } from 'react';
import Emulator from './Emulator';
import './Game.css';

let emulator = new Emulator();

export default function Screen({ height, width }) {
    const canvasRef = useRef(null);

    useEffect(() => {
	const ctx = canvasRef.current?.getContext("2d");
	if(ctx != null) {
	    const delay = Math.round(1000);
	    const interval = setInterval(() => {
		emulator.tick(ctx);
	    }, delay);

	    return () => clearInterval(interval);
	}
    });

    return (
	<>
	    <canvas className="screen"
		    width={ width }
		    height={ height }
		    ref={canvasRef}
	    ></canvas>
	</>
    );
}
