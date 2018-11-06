/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

export
const Characters =
{
	// Amanda Spellbinder
	amanda: {
		name: "Amanda",
		fullName: "Amanda Spellbinder",
		baseStats: {
			vit: 65,
			str: 60,
			def: 75,
			foc: 80,
			mag: 100,
			agi: 50,
		},
		skills: [
			'inferno',
			'tenPointFive',
			'subzero',
			'discharge',
			'omni',
			'heal',
			'dispel',
			'curse',
		],
	},

	// Bruce Arsen
	bruce: {
		name: "Bruce",
		fullName: "Bruce Arsen",
		baseStats: {
			vit: 65,
			str: 100,
			def: 50,
			foc: 80,
			mag: 30,
			agi: 55,
		},
		autoScan: true,
		startingWeapon: 'arsenRifle',
		skills: [
			'potshot',
			'shootout',
			'sharpshooter',
			'flare',
			'quake',
			'chill',
			'lightning',
			'heal',
			'rejuvenate',
			'renewal',
			'protectiveAura',
		],
	},

	// Elysia Ilapse
	elysia: {
		name: "Elysia",
		fullName: "Elysia Ilapse",
		baseStats: {
			vit: 40,
			str: 50,
			def: 50,
			foc: 90,
			mag: 65,
			agi: 100,
		},
		startingWeapon: 'fireAndIce',
		skills: [
			'archery',
			'tripleShot',
			'flareShot',
			'chillShot',
			'joltShot',
			'seismicShot',
			'hellfire',
			'windchill',
			'electrocute',
			'upheaval',
			'inferno',
			'subzero',
			'discharge',
			'tenPointFive',
			'heal',
			'rejuvenate',
			'renewal',
			'lazarus',
			'omni',
		],
	},

	// Justin Ilapse
	// Father of Elysia Ilapse. Justin has good intentions, but doesn't always know the right
	// way to act on them and often makes poor decisions as a result. In battle, he plays the
	// dual role of healer and saboteur, removing the enemy's enhancements while piling on
	// status afflictions of his own.
	justin: {
		name: "Justin",
		fullName: "Justin Ilapse",
		baseStats: {
			vit: 50,
			str: 35,
			def: 60,
			foc: 75,
			mag: 100,
			agi: 60,
		},
		autoScan: true,
		skills: [
			'flare',
			'chill',
			'lightning',
			'quake',
			'heal',
			'ignite',
			'frostbite',
			'jolt',
			'tremor',
			'dispel',
			'necromancy',
			'crackdown',
			'curse',
		],
	},

	// Katelyn Hippofoood
	// Doesn't actually exist.
	katelyn: {
		name: "Katelyn",
		fullName: "Katelyn Hippofoood",
		baseStats: {
			vit: 40,
			str: 5,
			def: 30,
			foc: 80,
			mag: 65,
			agi: 50,
		},
		skills: [
			'potshot',
			'inferno',
			'subzero',
			'discharge',
			'tenPointFive',
			'omni',
		],
	},

	// Lauren Adora
	// Scott's love interest and one of the three initial party members. She tends keep to herself
	// (except where maggie is involved) and often keeps quiet about things she really should
	// divulge in a misguided attempt to prevent what she sees as unnecessary turmoil. In battle,
	// she assails her enemies with throwing stars.
	lauren: {
		name: "Lauren",
		fullName: "Lauren Adora",
		baseStats: {
			vit: 30,
			str: 60,
			def: 40,
			foc: 90,
			mag: 70,
			agi: 70,
		},
		skills: [
			'starToss',
			'starVolley',
			'flare',
			'chill',
			'lightning',
			'quake',
		],
	},

	// maggie
	// An overweight hunger-pig and former leader of the neo-Hippos. She has renounced her role in the
	// group due to disagreement over their methods, particularly her sister's stubborn persecution of
	// Elysia Ilapse. In battle, maggie can devour her enemies, often gaining new skills in the process.
	maggie: {
		name: "maggie",
		baseStats: {
			vit: 100,
			str: 90,
			def: 85,
			foc: 65,
			mag: 30,
			agi: 35,
		},
		skills: [
			'munch',
			'fatseat',
			'fatSlam',
			'flameBreath',
		],
	},

	// Robert Spellbinder
	robert: {
		name: "Robert",
		fullName: "Robert Spellbinder",
		baseStats: {
			vit: 75,
			str: 75,
			def: 75,
			foc: 75,
			mag: 75,
			agi: 75,
		},
		startingWeapon: 'rsbSword',
		skills: [
			'swordSlash',
			'quickstrike',
			'flare',
			'quake',
			'chill',
			'lightning',
			'hellfire',
			'upheaval',
			'windchill',
			'electrocute',
			'omni',
			'ignite',
			'tremor',
			'frostbite',
			'jolt',
			'protectiveAura',
			'necromancy',
			'crackdown',
		],
	},

	// Scott Starcross
	// the protagonist of the Spectacles Saga.  always tries to do what's right, but is
	// naive to a fault.  in battle, Scott wields a balanced set of sword techniques,
	// elemental and status-inducing magicks.
	scott: {
		name: "Scott",
		fullName: "Scott Starcross",
		baseStats: {
			vit: 70,
			str: 70,
			def: 70,
			foc: 70,
			mag: 70,
			agi: 70,
		},
		startingWeapon: 'heirloom',
		skills: [
			'swordSlash',
			'quickstrike',
			'flare',
			'quake',
			'chill',
			'lightning',
			'hellfire',
			'upheaval',
			'windchill',
			'electrocute',
			'ignite',
			'tremor',
			'frostbite',
			'jolt',
			'crackdown',
		],
	},
};
