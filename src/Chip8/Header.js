import React from 'react';
import './Header.css';

export default function Header() {
    return (
	<>
	    <header>
		<nav className="navBar">
		    <h1>Chip8 Interpreter</h1>
		    <a href="https://github.com/beersonthewall" className="githubLink">Github</a>
		</nav>
	    </header>
	</>
    );
}
