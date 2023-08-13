import React from 'react';
import './Controls.css';

export default function Controls({ loadProgram, reset }) {
    return (
	<div className="ctrlContainer">
	    <button onClick={reset}>Reset</button>
	    <form onSubmit={loadProgram}>
		<input type="file" name="file" />
		<input type="submit" value="Run Program" />
	    </form>
	</div>
    );
}
