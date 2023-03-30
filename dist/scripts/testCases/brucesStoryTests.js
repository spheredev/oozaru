/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2023 Fat Cerberus
***/

import TestHarness from '../testHarness.js';

TestHarness.addBattle('horse', {
	battleID: 'headlessHorse',
	items: [ 'tonic' ],
	party: {
		scott: { level: 8, weapon: 'templeSword' },
	}
});

TestHarness.addBattle('rsb2', {
	battleID: 'rsbFinal',
	items: [ 'tonic', 'redBull', 'holyWater', 'vaccine', 'alcohol' ],
	party: {
		scott: { level: 50, weapon: 'templeSword' },
	},
});
