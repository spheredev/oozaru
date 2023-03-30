/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2023 Fat Cerberus
***/

import { Console, Music, Scene } from 'sphere-runtime';

import DayNightClock from './dayNightClock.js';
import TestHarness from './testHarness.js';

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

	let dayNight = new DayNightClock();
	await TestHarness.run('temple');
}
