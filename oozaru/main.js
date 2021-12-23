import Audialis from './audialis.js';
import Fido from './fido.js';
import Fontso from './fontso.js';
import Galileo from './galileo.js';
import InputEngine from './input-engine.js';
import Pegasus from './pegasus.js';
import { Version } from './version.js';
main();
async function main() {
    await Version.initialize();
    const urlQuery = new URL(location.href).searchParams;
    const gameID = urlQuery.get('game');
    window.addEventListener('error', e => {
        reportException(e.error);
    });
    window.addEventListener('unhandledrejection', e => {
        reportException(e.reason);
    });
    const menu = document.getElementById('menu');
    let useDistDir = true;
    try {
        const gameList = await Fido.fetchJSON('games/index.json');
        for (const entry of gameList) {
            const iconImage = document.createElement('img');
            iconImage.src = `games/${entry.gameID}/icon.png`;
            iconImage.width = 48;
            iconImage.height = 48;
            const anchor = document.createElement('a');
            anchor.className = 'game';
            if (entry.gameID === gameID)
                anchor.classList.add('running');
            anchor.title = entry.title;
            anchor.href = `${location.origin}${location.pathname}?game=${entry.gameID}`;
            anchor.appendChild(iconImage);
            menu.appendChild(anchor);
        }
        useDistDir = false;
    }
    catch {
        const iconImage = document.createElement('img');
        iconImage.src = `dist/icon.png`;
        iconImage.width = 48;
        iconImage.height = 48;
        menu.appendChild(iconImage);
    }
    const canvas = document.getElementById('screen');
    const overlay = document.getElementById('overlay');
    canvas.focus();
    canvas.onkeypress = canvas.onclick = async (e) => {
        if (gameID !== null || useDistDir) {
            document.body.classList.add('darkened');
            if (overlay !== null)
                overlay.style.opacity = '0';
            canvas.onclick = null;
            canvas.onkeydown = null;
            canvas.focus();
            await Galileo.initialize(canvas);
            await Audialis.initialize();
            await Fontso.initialize();
            InputEngine.initialize(canvas);
            Pegasus.initialize();
            await Pegasus.launchGame(gameID !== null ? `games/${gameID}` : 'dist');
        }
        else {
            reportException("Please select a game from the top menu first.");
        }
    };
}
function reportException(value) {
    let msg;
    if (value instanceof Error && value.stack !== undefined)
        msg = value.stack.replace(/\r?\n/g, '<br>');
    else
        msg = String(value);
    const readout = document.getElementById('readout');
    readout.classList.add('visible');
    readout.innerHTML = `an error occurred.\r\n\r\n${msg}`;
}
