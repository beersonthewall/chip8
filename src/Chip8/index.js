import React from 'react';
import Header from './Header';
import Game from './Game';

export default function Chip8() {
    return (
	<>
	    <Header/>
	    <Game height="320" width="640"/>
	</>
    );
}
