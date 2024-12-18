/**
 *  Specs Engine: the Spectacles Saga game engine
 *  Copyright © 2012-2024 Where'd She Go? Productions
 *  All rights reserved.
**/

export
const Enemies =
{
	beverly: {
		name: "Beverly",
		fullName: "Wide-Load Beverly",
		hasLifeBar: true,
		tier: 3,
		turnRatio: 3.0,
		baseStats: {
			vit: 90,
			str: 60,
			def: 80,
			foc: 50,
			mag: 65,
			agi: 35,
		},
		immunities: [],
		items: [],
	},
	
	robert2: {
		name: "Robert",
		fullName: "Robert Spellbinder",
		hasLifeBar: true,
		tier: 3,
		turnRatio: 1.0,
		baseStats: {
			vit: 75,
			str: 75,
			def: 75,
			foc: 75,
			mag: 75,
			agi: 75,
		},
		immunities: [],
		weapon: 'rsbSword',
		munchData: {
			skill: 'omni',
		},
		items: [
			'tonic',
			'powerTonic',
			'redBull',
			'holyWater',
			'vaccine',
			'alcohol',
		],
	},

	scottTemple: {
		name: "Temple",
		fullName: "Scott Victor Temple",
		hasLifeBar: true,
		tier: 3,
		turnRatio: 3.0,
		baseStats: {
			vit: 100,
			str: 85,
			def: 80,
			mag: 90,
			foc: 60,
			agi: 70,
		},
		immunities: [ 'zombie' ],
		weapon: 'templeSword',
		munchData: {
			skill: 'omni',
		},
	},

	starcross: {
		name: "Scott",
		fullName: "Scott Starcross",
		hasLifeBar: true,
		tier: 3,
		turnRatio: 1.0,
		baseStats: {
			vit: 70,
			str: 70,
			def: 70,
			foc: 70,
			mag: 70,
			agi: 70,
		},
		immunities: [],
		weapon: 'templeSword',
	},
};
