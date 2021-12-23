/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2021 Fat Cerberus
***/

import { Game } from './game.js';

export
const SkillCategories =
{
	attack: "Attack",
	magic: "Magic",
	heal: "Heal",
	strategy: "Strategy",
};

export
const Skills =
{
	// Sword/slashing techniques
	berserkCharge: {
		name: "Berserk Charge",
		category: 'attack',
		weaponType: 'sword',
		targetType: 'allEnemies',
		actions: [
			{
				announceAs: "Berserk Charge",
				rank: 5,
				accuracyType: 'sword',
				isMelee: false,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'sword',
						power: 100,
					},
					{
						targetHint: 'user',
						type: 'addStatus',
						status: 'winded',
					},
				],
			},
		],
	},
	chargeSlash: {
		name: "Charge Slash",
		category: 'attack',
		weaponType: 'sword',
		targetType: 'single',
		actions: [
			{
				announceAs: "wait for it...",
				rank: 1,
				effects: [
					{
						targetHint: 'user',
						type: 'addStatus',
						status: 'offGuard',
					},
				],
			},
			{
				announceAs: "Charge Slash",
				rank: 2,
				accuracyType: 'sword',
				isMelee: true,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'sword',
						power: 50,
					},
				],
			},
		],
	},
	desperationSlash: {
		name: "Desperation Slash",
		category: 'attack',
		weaponType: 'sword',
		targetType: 'single',
		actions: [
			{
				announceAs: "Robert seems desperate...",
				rank: 3,
				effects: [
					{
						targetHint: 'user',
						type: 'addStatus',
						status: 'offGuard',
					},
				],
			},
			{
				announceAs: "Desperation Slash",
				rank: 5,
				accuracyType: 'sword',
				effects: [
					{
						targetHint: 'selected',
						type: 'instaKill',
						damageType: 'sword',
					},
				],
			},
		],
	},
	quickstrike: {
		name: "Quickstrike",
		category: 'attack',
		weaponType: 'sword',
		targetType: 'single',
		actions: [
			{
				announceAs: "Quickstrike",
				isMelee: true,
				rank: 1,
				accuracyType: 'sword',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'sword',
						power: 5,
					},
				],
			},
		],
	},
	knockBack: {
		name: "Knock Back",
		category: 'attack',
		targetType: 'single',
		actions: [
			{
				announceAs: "Knock Back",
				rank: 2,
				accuracyType: 'physical',
				isMelee: true,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'physical',
						power: 20,
					},
					{
						targetHint: 'selected',
						type: 'knockBack',
						rank: 2,
					},
				],
			},
		],
	},
	swordSlash: {
		name: "Sword Slash",
		category: 'attack',
		weaponType: 'sword',
		targetType: 'single',
		actions: [
			{
				announceAs: "Sword Slash",
				rank: 2,
				accuracyType: 'sword',
				isMelee: true,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'sword',
						power: 15,
					},
				],
			},
		],
	},

	// Staff techniques
	thwack: {
		name: "Thwack",
		category: 'attack',
		weaponType: 'staff',
		targetType: 'single',
		actions: [
			{
				announceAs: "Thwack",
				rank: 2,
				accuracyType: 'staff',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'staff',
						power: 15,
					},
				],
			},
		],
	},
	whipstaff: {
		name: "Whipstaff",
		category: 'attack',
		weaponType: 'staff',
		targetType: 'single',
		actions: [
			{
				announceAs: "Whipstaff",
				rank: 2,
				accuracyType: 'staff',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'staff',
						power: 10,
					},
					{
						targetHint: 'selected',
						type: 'knockBack',
						rank: 2,
					},
				],
			},
		],
	},

	// Bow & Arrow techniques
	archery: {
		name: "Archery",
		category: 'attack',
		weaponType: 'bow',
		targetType: 'single',
		actions: [
			{
				announceAs: "Archery",
				rank: 2,
				accuracyType: 'bow',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'bow',
						power: 15,
					},
				],
			},
		],
	},
	chillShot: {
		name: "Chill Shot",
		category: 'attack',
		weaponType: 'bow',
		targetType: 'single',
		baseMPCost: 5,
		actions: [
			{
				announceAs: "Chill Shot",
				rank: 2,
				accuracyType: 'bow',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magicArrow',
						power: 15,
						element: 'ice',
					},
				],
			},
		],
	},
	flareShot: {
		name: "Flare Shot",
		category: 'attack',
		weaponType: 'bow',
		targetType: 'single',
		baseMPCost: 5,
		actions: [
			{
				announceAs: "Flare Shot",
				rank: 2,
				accuracyType: 'bow',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magicArrow',
						power: 15,
						element: 'fire',
					},
				],
			},
		],
	},
	joltShot: {
		name: "Jolt Shot",
		category: 'attack',
		weaponType: 'bow',
		targetType: 'single',
		baseMPCost: 5,
		actions: [
			{
				announceAs: "Jolt Shot",
				rank: 2,
				accuracyType: 'bow',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magicArrow',
						power: 15,
						element: 'lightning',
					},
				],
			},
		],
	},
	seismicShot: {
		name: "Seismic Shot",
		category: 'attack',
		weaponType: 'bow',
		targetType: 'single',
		baseMPCost: 5,
		actions: [
			{
				announceAs: "Seismic Shot",
				rank: 2,
				accuracyType: 'bow',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magicArrow',
						power: 15,
						element: 'earth',
					},
				],
			},
		],
	},
	tripleShot: {
		name: "Triple Shot",
		category: 'attack',
		weaponType: 'bow',
		targetType: 'allEnemies',
		actions: [
			{
				announceAs: "Triple Shot",
				animation: 'tripleShot',
				rank: 3,
				accuracyType: 'bow',
				accuracyRate: 1 / Game.bonusMultiplier,
				effects: [
					{
						targetHint: 'random',
						type: 'damage',
						damageType: 'bow',
						power: 10,
					},
					{
						targetHint: 'random',
						type: 'damage',
						damageType: 'bow',
						power: 10,
					},
					{
						targetHint: 'random',
						type: 'damage',
						damageType: 'bow',
						power: 10,
					},
				],
			},
		],
	},

	// Gun techniques
	potshot: {
		name: "Potshot",
		category: 'attack',
		weaponType: 'gun',
		targetType: 'single',
		actions: [
			{
				announceAs: "Potshot",
				rank: 2,
				accuracyType: 'gun',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'gun',
						power: 15,
					},
				],
			},
		],
	},
	sharpshooter: {
		name: "Sharpshooter",
		category: 'attack',
		weaponType: 'gun',
		targetType: 'single',
		actions: [
			{
				announceAs: "Line Up",
				rank: 2,
				effects: [
					{
						targetHint: 'user',
						type: 'addStatus',
						status: 'sniper',
					},
				],
			},
			{
				announceAs: "Sharpshooter",
				rank: 3,
				accuracyRate: Infinity,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'gun',
						power: 50,
					},
				],
			},
		],
	},
	shootout: {
		name: "Shootout",
		category: 'attack',
		weaponType: 'gun',
		targetType: 'allEnemies',
		actions: [
			{
				announceAs: "Shootout",
				rank: 3,
				accuracyType: 'gun',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'gun',
						power: 15,
					},
				],
			},
		],
	},

	// Shuriken (throwing star) techniques
	starToss: {
		name: "Star Toss",
		category: 'attack',
		weaponType: 'shuriken',
		targetType: 'single',
		actions: [
			{
				announceAs: "Star Toss",
				rank: 1,
				accuracyType: 'shuriken',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'shuriken',
						power: 15,
					},
				],
			},
		],
	},
	starVolley: {
		name: "Star Volley",
		category: 'attack',
		weaponType: 'shuriken',
		targetType: 'single',
		actions: [
			{
				announceAs: "Star Volley",
				rank: 2,
				accuracyType: 'shuriken',
				hits: 5,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'shuriken',
						power: 8,
					},
				],
			},
		],
	},

	// basic elemental magic spells
	flare:     basicSpell("Flare", 'fire'),
	quake:     basicSpell("Quake", 'earth'),
	chill:     basicSpell("Chill", 'ice'),
	lightning: basicSpell("Lightning", 'lightning'),

	// status-inflicting magicks
	ignite:    statusSpell("Ignite", 'fire', 'ignite'),
	tremor:    statusSpell("Tremor", 'earth', 'disarray'),
	frostbite: statusSpell("Frostbite", 'ice', 'frostbite'),
	jolt:      statusSpell("Jolt", 'lightning', 'zombie'),

	// powerful second-tier magicks
	hellfire:    powerSpell("Hellfire", 'fire', 'ignite'),
	upheaval:    powerSpell("Upheaval", 'earth', 'disarray'),
	windchill:   powerSpell("Windchill", 'ice', 'frostbite'),
	electrocute: powerSpell("Electrocute", 'lightning', 'zombie'),

	// Rank 4 magic - damage + field condition, group-cast
	inferno:      ultraSpell("Inferno", 'fire', 'ignite'),
	subzero:      ultraSpell("Subzero", 'ice', 'frostbite'),
	tenPointFive: ultraSpell("10.5", 'earth', 'disarray'),
	discharge:    ultraSpell("Discharge", 'lightning', 'zombie'),

	omni: {
		name: "Omni",
		category: 'magic',
		targetType: 'single',
		baseMPCost: 75,
		actions: [
			{
				announceAs: "Omni",
				rank: 4,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 100,
						element: 'omni',
					},
					{
						targetHint: 'user',
						type: 'addStatus',
						status: 'winded',
					},
				],
			},
		],
	},

	// Curative/healing magicks
	dispel: {
		name: "Dispel",
		category: 'strategy',
		targetType: 'single',
		baseMPCost: 40,
		actions: [
			{
				announceAs: "Dispel",
				rank: 3,
				effects: [
					{
						targetHint: 'selected',
						type: 'liftStatusTags',
						tags: [ 'buff' ],
					},
				],
			},
		],
	},
	immunize: {
		name: "Immunize",
		category: 'strategy',
		targetType: 'ally',
		baseMPCost: 50,
		actions: [
			{
				announceAs: "Immunize",
				rank: 3,
				effects: [
					{
						targetHint: 'selected',
						type: 'liftStatusTags',
						tags: [ 'ailment' ],
					},
					{
						targetHint: 'selected',
						type: 'addStatus',
						status: 'immune',
					},
				],
			},
		],
	},
	lazarus: {
		name: "Lazarus",
		category: 'heal',
		targetType: 'ally',
		allowDeadTarget: true,
		baseMPCost: 30,
		actions: [
			{
				announceAs: "Lazarus",
				rank: 3,
				effects: [
					{
						targetHint: 'selected',
						type: 'revive',
						strength: 25,
						element: 'cure',
					},
				],
			},
		],
	},
	purify: {
		name: "Purify",
		category: 'heal',
		targetType: 'ally',
		baseMPCost: 15,
		actions: [
			{
				announceAs: "Purify",
				rank: 3,
				effects: [
					{
						targetHint: 'selected',
						type: 'liftStatusTags',
						tags: [ 'ailment' ],
					},
				],
			},
		],
	},
	salve: {
		name: "Salve",
		category: 'heal',
		targetType: 'ally',
		baseMPCost: 10,
		actions: [
			{
				announceAs: "Salve",
				rank: 3,
				effects: [
					{
						targetHint: 'selected',
						type: 'addStatus',
						status: 'reGen',
					},
				],
			},
		],
	},
	heal: {
		name: "Heal",
		category: 'heal',
		targetType: 'ally',
		groupCast: true,
		baseMPCost: 5,
		actions: [
			{
				announceAs: "Heal",
				rank: 2,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'heal',
						power: 25,
						element: 'cure',
					},
				],
			},
		],
	},
	rejuvenate: {
		name: "Rejuvenate",
		category: 'heal',
		targetType: 'ally',
		groupCast: true,
		baseMPCost: 10,
		actions: [
			{
				announceAs: "Rejuvenate",
				rank: 3,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'heal',
						power: 50,
						element: 'cure',
					},
				],
			},
		],
	},
	renew: {
		name: "Renew",
		category: 'heal',
		targetType: 'ally',
		groupCast: true,
		baseMPCost: 20,
		actions: [
			{
				announceAs: "Renew",
				rank: 3,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'heal',
						power: 100,
						element: 'cure',
					},
				],
			},
		],
	},

	// Status-inducing techniques
	crackdown: {
		name: "Crackdown",
		category: 'strategy',
		targetType: 'single',
		baseMPCost: 50,
		actions: [
			{
				announceAs: "Crackdown",
				rank: 3,
				effects: [
					{
						targetHint: 'selected',
						type: 'addStatus',
						status: 'crackdown',
					},
				],
			},
		],
	},
	curse: {
		name: "Curse",
		category: 'strategy',
		targetType: 'single',
		baseMPCost: 50,
		actions: [
			{
				announceAs: "Curse",
				rank: 3,
				effects: [
					{
						targetHint: 'selected',
						type: 'addStatus',
						status: 'curse',
					},
				],
			},
		],
	},
	necromancy: {
		name: "Necromancy",
		category: 'strategy',
		targetType: 'single',
		baseMPCost: 15,
		actions: [
			{
				announceAs: "Necromancy",
				rank: 3,
				effects: [
					{
						targetHint: 'selected',
						type: 'addStatus',
						status: 'zombie',
					},
				],
			},
		],
	},
	protect: {
		name: "Protect",
		category: 'strategy',
		targetType: 'ally',
		baseMPCost: 20,
		actions: [
			{
				announceAs: "Protect",
				rank: 2,
				effects: [
					{
						targetHint: 'selected',
						type: 'addStatus',
						status: 'protect',
					},
				],
			},
		],
	},

	// Physical-contact techniques
	fatSlam: {
		name: "Fat Slam",
		category: 'attack',
		targetType: 'single',
		actions: [
			{
				announceAs: "Fat Slam",
				rank: 3,
				accuracyType: 'physical',
				isMelee: true,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'physical',
						power: 50,
						element: 'fat',
					},
				],
			},
		],
	},
	fatseat: {
		name: "Fatseat",
		category: 'attack',
		targetType: 'allEnemies',
		actions: [
			{
				announceAs: "Fatseat",
				rank: 2,
				accuracyType: 'physical',
				isMelee: false,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'physical',
						power: 25,
						element: 'fat',
					},
				],
			},
		],
	},
	munch: {
		name: "Munch",
		category: 'attack',
		targetType: 'single',
		actions: [
			{
				announceAs: "Munch",
				animation: 'munch',
				rank: 5,
				accuracyType: 'devour',
				isMelee: true,
				effects: [
					{
						element: 'fat',
						targetHint: 'selected',
						type: 'devour',
						successRate: 1.0,
					},
				],
			},
		],
	},

	// Enemy techniques
	bite: {
		name: "Bite",
		category: 'attack',
		targetType: 'single',
		actions: [
			{
				announceAs: "Bite",
				rank: 2,
				accuracyType: 'physical',
				isMelee: true,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'physical',
						power: 30,
					},
				],
			},
		],
	},
	deathBite: {
		name: "Death Bite",
		category: 'attack',
		targetType: 'single',
		actions: [
			{
				announceAs: "Death Bite",
				rank: 1,
				accuracyType: 'physical',
				isMelee: true,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'physical',
						power: 10,
						addStatus: 'zombie',
					},
				],
			},
		],
	},
	delusion: {
		name: "Delusion",
		category: 'strategy',
		targetType: 'single',
		actions: [
			{
				announceAs: "Delusion",
				rank: 3,
				effects: [
					{
						targetHint: 'selected',
						type: 'addStatus',
						status: 'delusion',
					},
				],
			},
		],
	},
	flameBreath: {
		name: "Flame Breath",
		category: 'magic',
		targetType: 'allEnemies',
		baseMPCost: 25,
		actions: [
			{
				announceAs: "Flame Breath",
				rank: 2,
				accuracyType: 'breath',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'breath',
						power: 20,
						element: 'fire',
						addStatus: 'ignite',
					},
				],
			},
		],
	},
	flareUp: {
		name: "Flare Up",
		category: 'attack',
		targetType: 'allEnemies',
		actions: [
			{
				announceAs: "Flare Up",
				rank: 2,
				effects: [
					{
						targetHint: 'user',
						type: 'addStatus',
						status: 'ignite',
					},
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 15,
						element: 'fire',
					},
				],
			},
		],
	},
	rearingKick: {
		name: "Rearing Kick",
		category: 'attack',
		targetType: 'single',
		actions: [
			{
				announceAs: "Rear Up",
				rank: 1,
				effects: [
					{
						targetHint: 'user',
						type: 'addStatus',
						status: 'rearing',
					},
				],
			},
			{
				announceAs: "Rearing Kick",
				rank: 2,
				accuracyType: 'physical',
				isMelee: true,
				effects: [
					{
						targetHint: 'user',
						type: 'liftStatus',
						statuses: [ 'ghost' ],
					},
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'physical',
						power: 25,
					},
				],
			},
		],
	},
	spectralReversion: {
		name: "Spectral Reversion",
		category: 'strategy',
		targetType: 'ally',
		baseMPCost: 50,
		actions: [
			{
				announceAs: "Spectral Reversion",
				rank: 3,
				effects: [
					{
						targetHint: 'selected',
						type: 'addStatus',
						status: 'ghost',
					},
				],
			},
		],
	},
	spectralKick: {
		name: "Spectral Kick",
		category: 'attack',
		targetType: 'single',
		actions: [
			{
				announceAs: "Spectral Kick",
				rank: 3,
				accuracyType: 'physical',
				isMelee: true,
				effects: [
					{
						targetHint: 'user',
						type: 'liftStatus',
						status: 'ghost',
					},
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'physical',
						power: 50,
					},
				],
			},
		],
	},
	tackle: {
		name: "Tackle",
		category: 'attack',
		targetType: 'single',
		actions: [
			{
				announceAs: "Tackle",
				rank: 2,
				accuracyType: 'physical',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'physical',
						power: 15,
					},
				],
			},
		],
	},
	trample: {
		name: "Trample",
		category: 'physical',
		targetType: 'single',
		actions: [
			{
				announceAs: "Trample",
				rank: 2,
				accuracyType: 'physical',
				isMelee: true,
				effects: [
					{
						targetHint: 'selected',
						type: 'instaKill',
						damageType: 'physical',
					},
				],
			},
		],
	},
};

function basicSpell(name, element)
{
	return {
		name,
		category: 'magic',
		targetType: 'single',
		baseMPCost: 10,
		actions: [
			{
				announceAs: name,
				rank: 2,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 20,
						element,
					},
				],
			},
		],
	};
}

function powerSpell(name, element, statusID)
{
	return {
		name,
		category: 'magic',
		targetType: 'single',
		baseMPCost: 20,
		actions: [
			{
				announceAs: name,
				rank: 3,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 35,
						element: element,
						addStatus: statusID,
						statusChance: 10,
					},
				],
			},
		],
	};
}

function ultraSpell(name, element, statusID)
{
	return {
		name,
		category: 'magic',
		targetType: 'allEnemies',
		baseMPCost: 40,
		actions: [
			{
				announceAs: name,
				rank: 4,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 65,
						element,
						addStatus: statusID,
						statusChance: 25,
					},
				],
			},
		],
	}
}

function statusSpell(name, element, statusID)
{
	return {
		name,
		category: 'strategy',
		targetType: 'single',
		baseMPCost: 10,
		actions: [
			{
				announceAs: name,
				rank: 2,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 10,
						element,
						addStatus: statusID,
						statusChance: 100,
						ignoreGuard: true,
					},
				],
			},
		],
	};
}
