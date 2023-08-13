import React from 'react';
import './Header.css';
import GithubLogo from './github-mark.png';
import HouseLogo from './house-solid.svg';

export default function Header() {
    return (
	<>
	    <header>
		<nav className="navBar">
		    <div className="navTitle">
			<h1>Chip8 Interpreter</h1>
		    </div>
		    <div className="navLinks">
			<a href="https://www.beersonthewall.com">
			    <img class="linkIcon" src={HouseLogo} alt="Homepage link" />
			</a>
			<a href="https://github.com/beersonthewall">
			    <img className="linkIcon" src={GithubLogo} alt="Github logo" />
			</a>
		    </div>
		</nav>
	    </header>
	</>
    );
}
