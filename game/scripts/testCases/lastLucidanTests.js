/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import TestHarness from '../testHarness.js';

TestHarness.addBattle('temple', {
	battleID: 'scottTemple',
	party: {
		elysia: {
			level: 60,
			weapon: 'powerBow',
			items: [
				'tonic',
				'powerTonic',
				'fullTonic',
				'redBull',
				'holyWater',
				'vaccine',
			],
		},
		justin: {
			level: 60,
			items: [
				'fullTonic',
				'lazarusPotion',
			],
		},
		bruce: {
			level: 60,
			weapon: 'arsenRifle',
			items: [],
		},
	},
});

TestHarness.addBattle('starcross', {
	battleID: 'scottStarcross',
	party: {
		bruce: {
			level: 100,
			weapon: 'arsenRifle',
			items: [],
		},
		robert: {
			level: 100,
			weapon: 'rsbSword',
			items: [],
		},
		amanda: {
			level: 100,
			items: [],
		},
	},
});
