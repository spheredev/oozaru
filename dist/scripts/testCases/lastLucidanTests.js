/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2021 Fat Cerberus
***/

import TestHarness from '../testHarness.js';

TestHarness.addBattle('temple', {
	battleID: 'scottTemple',
	party: {
		elysia: { level: 60, weapon: 'powerBow', },
		abigail: { level: 60, weapon: 'luckyStaff' },
		bruce: { level: 60, weapon: 'arsenRifle' },
	},
	items: [
		'tonic',
		'powerTonic',
		'fullTonic',
		'redBull',
		'holyWater',
		'lazarusPotion',
	],
});

TestHarness.addBattle('starcross', {
	battleID: 'scottStarcross',
	party: {
		elysia: { level: 100, weapon: 'powerBow' },
		bruce: { level: 100, weapon: 'arsenRifle' },
		abigail: { level: 100, weapon: 'luckyStuff' },
	},
	items: [
		'tonic',
		'powerTonic',
		'fullTonic',
		'redBull',
	],
});
