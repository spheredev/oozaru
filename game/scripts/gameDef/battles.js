/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { Scene } from '/game/lib/sphere-runtime.js';

export
const Battles =
{
	rsbFinal:
	{
		title: "Robert Spellbinder",
		isFinalBattle: true,
		bgm: 'thePromise',
		battleLevel: 50,
		enemies: [
			'robert2',
		],
		async onStart() {
			let scottUnit = this.findUnit('scott');
			if (scottUnit !== null) {
				scottUnit.addStatus('specsAura');
				await new Scene()
					.talk("Robert", true, 1.0, Infinity,
						"Bruce's death changed nothing.  Hell, if anything, it's made you far too reckless. Look around, "
						+ "Scott!  Where are your friends?  Did they abandon you in your most desperate hour, or are you truly "
						+ "so brazen as to face me alone?")
					.talk("Scott", true, 1.0, Infinity,
						"I owe Bruce my life, Robert! To let his story end here... that's something I won't allow.  "
						+ "Not now. Not when I know just what my world would become if I did!")
					.pause(120)
					.talk("Robert", true, 1.0, Infinity, "What makes you so sure you have a choice?")
					.run();
			}
		},
	},

	scottTemple:
	{
		title: "Scott Victor Temple",
		isFinalBattle: true,
		bgm: 'revelation',
		battleLevel: 60,
		enemies: [
			'scottTemple',
		],
	},

	scottStarcross:
	{
		title: "Scott Starcross",
		isFinalBattle: true,
		bgm: 'deathComeNearMe',
		battleLevel: 100,
		enemies: [
			'starcross',
		],
		onStart() {
			let scottUnit = this.findUnit('starcross');
			scottUnit.addStatus('specsAura');
		},
	},
};
