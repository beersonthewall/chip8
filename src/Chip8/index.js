import React from 'react';
import Header from './Header';
import Controls from './Controls';
import Game from './Game';

export default function Chip8() {
    return (
	<>
	    <Header/>
	    <p>Welcome to my Chip8 interpreter built with JavaScript & React.</p>
	    <Game height="500" width="500"/>
	    <Controls/>
	</>
    );
}
