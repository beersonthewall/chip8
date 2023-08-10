import React, { useRef } from 'react';
import './Screen.css';

export default function Screen({ height, width }) {
    const canvasRef = useRef('canvas');
    return (
	<>
	    <canvas class="screen"
		    width={ width }
		    height={ height }
		    ref={canvasRef}
	    ></canvas>
	</>
    );
}
