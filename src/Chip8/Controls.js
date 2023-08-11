import React from 'react';

export default function Controls({ loadProgram, reset }) {
    return (
	<>
	    <button onClick={reset}>Reset Interpreter</button>
	    <form onSubmit={loadProgram}>
		<input type="file" name="file" />
		<input type="submit" value="Run Program" />
	    </form>
	</>
    );
}
