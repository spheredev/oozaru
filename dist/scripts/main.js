/**
 *  Specs Engine: the Spectacles Saga game engine
 *  Copyright © 2012-2024 Where'd She Go? Productions
 *  All rights reserved.
**/

import { Console, Music, Scene } from 'sphere-runtime';

import DayNightClock from './dayNightClock.js';
import TestHarness from './testHarness.js';
import TitleScreen from './titleScreen.js';

import './defineScenelets.js';

globalThis.console =
	new Console({ hotKey: Key.Tilde });

export default
async function main()
{
	Scene.defaultPriority = 99;

	console.defineObject('bgm', null, {
		async 'override'(fileName) { await Music.override(fileName); },
		'pop'() { Music.pop(); },
		async 'play'(fileName) { await Music.play(`music/${fileName}.ogg`); },
		async 'push'(fileName) { await Music.push(`music/${fileName}.ogg`); },
		'reset'() { Music.reset(); },
		'stop'() { Music.override(null); },
		'volume'(value) { Music.adjustVolume(value); },
	});
	console.defineObject('yap', null, {
		'on'() {
			Sphere.Game.disableTalking = false;
			console.log("hey, so there's this talking pig behind you...");
		},
		'off'() {
			Sphere.Game.disableTalking = true;
			console.log("hooray! now everyone will shut up FOREVER.");
		},
	});

	await TestHarness.initialize();

	//await new TitleScreen().run();
	
	const dayNight = new DayNightClock();
	await TestHarness.run('temple');
}
