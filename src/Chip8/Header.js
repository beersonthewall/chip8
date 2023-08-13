import React from 'react';
import './Header.css';
import GithubIcon from './github-mark.png';
import HouseIcon from './house-solid.svg';
import CodeIcon from './code-solid.svg';
import GameIcon from './gamepad-solid.svg';

export default function Header() {
    return (
	<>
	    <header>
		<nav className="navBar">
		    <div className="navTitle">
			<h1>Chip8 Interpreter</h1>
		    </div>
		    <div className="navLinks">
			<a href="https://johnearnest.github.io/chip8Archive/">
			    <img className="linkIcon" src={GameIcon} alt="Chip8 games link" />
			</a>
			<a href="https://github.com/beersonthewall/chip8">
			    <img className="linkIcon" src={CodeIcon} alt="Source code link" />
			</a>
			<a href="https://www.beersonthewall.com">
			    <img className="linkIcon" src={HouseIcon} alt="Homepage link" />
			</a>
			<a href="https://github.com/beersonthewall">
			    <img className="linkIcon" src={GithubIcon} alt="Github logo" />
			</a>
		    </div>
		</nav>
	    </header>
	</>
    );
}
