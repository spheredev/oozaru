/**
 *  Specs Engine: the Spectacles Saga game engine
 *  Copyright © 2012-2024 Where'd She Go? Productions
 *  All rights reserved.
**/

import TestHarness from '../testHarness.js';

TestHarness.addBattle('temple', {
	battleID: 'scottTemple',
	party: {
		elysia: { level: 60, weapon: 'powerBow', },
		lauren: { level: 60, weapon: 'risingSun' },
		abigail: { level: 60, weapon: 'luckyStaff' },
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
		lauren: { level: 100, weapon: 'risingSun' },
		abigail: { level: 100, weapon: 'luckyStuff' },
	},
	items: [
		'tonic',
		'powerTonic',
		'fullTonic',
		'redBull',
	],
});
