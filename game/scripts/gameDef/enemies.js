/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

export
const Enemies =
{
	robert2:
	{
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


	scottTemple:
	{
		name: "S. Temple",
		fullName: "Scott Victor Temple",
		hasLifeBar: true,
		tier: 3,
		turnRatio: 1.0,
		baseStats: {
			vit: 100,
			str: 85,
			def: 80,
			foc: 60,
			mag: 90,
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
