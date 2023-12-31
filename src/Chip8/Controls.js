import React from 'react';
import './Controls.css';
import FolderIcon from './folder-open-solid.svg';

export default function Controls({ loadProgram, reset }) {
    return (
	<form onSubmit={loadProgram} className="ctrlContainer">
	    <button className="ctrl" onClick={reset}>Reset</button>
	    <label className="romUploadLbl ctrl" htmlFor="romUpload" >
		<img src={FolderIcon} id="folderImg" alt="Load ROM file input" />
		Load ROM
	    </label>
	    <input id="romUpload" className="ctrl" type="file" name="file" />
	    <input className="ctrl run" type="submit" value="Run Program" />
	</form>
    );
}
