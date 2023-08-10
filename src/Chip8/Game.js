import React, { useEffect, useRef } from 'react';
import Interpreter from './Interpreter';
import './Game.css';

let interp = new Interpreter();

export default function Screen({ height, width }) {
    const canvasRef = useRef(null);

    useEffect(() => {
	const ctx = canvasRef.current?.getContext("2d");
	if(ctx != null) {
	    const delay = Math.round(1000);
	    const interval = setInterval(() => {
		interp.tick(ctx);
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
