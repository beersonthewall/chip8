import React from 'react';
import Header from './Header';
import Game from './Game';

export default function Chip8() {
    return (
	<>
	    <Header/>
	    <p>Welcome to my Chip8 interpreter built with JavaScript & React.</p>
	    <Game height="320" width="640"/>
	</>
    );
}
