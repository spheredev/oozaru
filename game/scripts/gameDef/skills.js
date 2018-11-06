/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
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
		targetType: 'single',
		forceCharge: true,
		actions: [
			{
				announceAs: "Berserk Charge",
				rank: 5,
				accuracyType: 'sword',
				isMelee: false,
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
	chargeSlash: {
		name: "Charge Slash",
		category: 'attack',
		weaponType: 'sword',
		targetType: 'single',
		actions: [
			{
				announceAs: "Charge",
				rank: 1,
				preserveGuard: true,
				effects: [
					{
						targetHint: 'user',
						type: 'addStatus',
						status: 'offGuard',
					},
				],
			},
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
						power: 22.5,
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
				announceAs: "#9's Desperation...",
				rank: 3,
				preserveGuard: true,
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
		chargeable: false,
		actions: [
			{
				announceAs: "Quickstrike",
				isMelee: true,
				preserveGuard: true,
				rank: 1,
				accuracyType: 'sword',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'sword',
						power: 10,
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
		baseMPCost: 10,
		actions: [
			{
				announceAs: "Chill Shot",
				rank: 2,
				accuracyType: 'bow',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'bow',
						power: 10,
						element: 'ice',
						addStatus: 'frostbite',
						statusChance: 25,
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
		baseMPCost: 10,
		actions: [
			{
				announceAs: "Flare Shot",
				rank: 2,
				accuracyType: 'bow',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'bow',
						power: 10,
						element: 'fire',
						addStatus: 'ignite',
						statusChance: 25,
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
		baseMPCost: 10,
		actions: [
			{
				announceAs: "Jolt Shot",
				rank: 2,
				accuracyType: 'bow',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'bow',
						power: 10,
						element: 'lightning',
						addStatus: 'zombie',
						statusChance: 25,
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
		baseMPCost: 10,
		actions: [
			{
				announceAs: "Seismic Shot",
				rank: 2,
				accuracyType: 'bow',
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'bow',
						power: 10,
						element: 'earth',
						addStatus: 'disarray',
						statusChance: 25,
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
				rank: 2,
				accuracyType: 'bow',
				accuracyRate: 1 / Game.bonusMultiplier,
				effects: [
					{
						targetHint: 'random',
						type: 'damage',
						damageType: 'bow',
						power: 25,
					},
					{
						targetHint: 'random',
						type: 'damage',
						damageType: 'bow',
						power: 25,
					},
					{
						targetHint: 'random',
						type: 'damage',
						damageType: 'bow',
						power: 25,
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
				announceAs: "Lining Up...",
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
						power: 80,
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
						power: 10,
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
	inferno: {
		name: "Inferno",
		category: 'magic',
		targetType: 'allEnemies',
		baseMPCost: 35,
		actions: [
			{
				announceAs: "Inferno",
				rank: 4,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 40,
						element: 'fire',
					},
					{
						targetHint: 'selected',
						type: 'addCondition',
						condition: 'inferno',
					},
				],
			},
		],
	},
	subzero: {
		name: "Subzero",
		category: 'magic',
		targetType: 'allEnemies',
		baseMPCost: 35,
		actions: [
			{
				announceAs: "Subzero",
				rank: 4,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 40,
						element: 'ice',
					},
					{
						targetHint: 'selected',
						type: 'addCondition',
						condition: 'subzero',
					},
				],
			},
		],
	},
	tenPointFive: {
		name: "10.5",
		category: 'magic',
		targetType: 'allEnemies',
		baseMPCost: 35,
		actions: [
			{
				announceAs: "10.5",
				rank: 4,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 40,
						element: 'earth',
					},
					{
						targetHint: 'selected',
						type: 'addCondition',
						condition: 'generalDisarray',
					},
				],
			},
		],
	},
	discharge: {
		name: "Discharge",
		category: 'magic',
		targetType: 'allEnemies',
		baseMPCost: 35,
		actions: [
			{
				announceAs: "Discharge",
				rank: 4,
				effects: [
					{
						targetHint: 'selected',
						type: 'damage',
						damageType: 'magic',
						power: 40,
						element: 'lightning',
					},
					{
						targetHint: 'selected',
						type: 'addCondition',
						condition: 'thunderstorm',
					},
				],
			},
		],
	},

	// Omni - Rank 4 non-elemental magic
	omni: {
		name: "Omni",
		category: 'magic',
		targetType: 'single',
		baseMPCost: 100,
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
	convalesce: {
		name: "Convalesce",
		category: 'heal',
		targetType: 'ally',
		baseMPCost: 75,
		allowAsCounter: false,
		actions: [
			{
				announceAs: "Convalesce",
				rank: 3,
				preserveGuard: true,
				effects: [
					{
						targetHint: 'selected',
						type: 'addStatus',
						status: 'reGen',
						element: 'cure',
					},
				],
			},
		],
	},
	dispel: {
		name: "Dispel",
		category: 'heal',
		targetType: 'single',
		baseMPCost: 25,
		allowAsCounter: false,
		actions: [
			{
				announceAs: "Dispel",
				rank: 3,
				preserveGuard: true,
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
		targetType: 'single',
		baseMPCost: 50,
		allowAsCounter: false,
		chargeable: false,
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
	heal: {
		name: "Heal",
		category: 'heal',
		targetType: 'ally',
		baseMPCost: 10,
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
	lazarus: {
		name: "Lazarus",
		category: 'heal',
		targetType: 'ally',
		allowDeadTarget: true,
		baseMPCost: 50,
		actions: [
			{
				announceAs: "Lazarus",
				rank: 3,
				effects: [
					{
						targetHint: 'selected',
						type: 'revive',
						healToFull: true,
						element: 'cure',
					},
				],
			},
		],
	},
	purify: {
		name: "Purify",
		category: 'heal',
		targetType: 'single',
		baseMPCost: 50,
		actions: [
			{
				announceAs: "Purify",
				rank: 3,
				preserveGuard: true,
				effects: [
					{
						targetHint: 'selected',
						type: 'liftStatusTags',
						tags: [ 'undead' ],
					},
				],
			},
		],
	},
	rejuvenate: {
		name: "Rejuvenate",
		category: 'heal',
		targetType: 'ally',
		baseMPCost: 20,
		actions: [
			{
				announceAs: "Rejuvenate",
				rank: 3,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'heal',
						power: 60,
						element: 'cure',
						addStatus: 'reGen',
						statusChance: 100,
					},
				],
			},
		],
	},
	renewal: {
		name: "Renewal",
		category: 'heal',
		targetType: 'allAllies',
		baseMPCost: 40,
		actions: [
			{
				announceAs: "Renewal",
				rank: 4,
				accuracyType: 'magic',
				effects: [
					{
						targetHint: 'selected',
						type: 'heal',
						power: 100,
						element: 'cure',
					},
					{
						targetHint: 'selected',
						type: 'addCondition',
						condition: 'healingAura',
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
		allowAsCounter: false,
		chargeable: false,
		actions: [
			{
				announceAs: "Crackdown",
				rank: 3,
				preserveGuard: true,
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
		baseMPCost: 70,
		allowAsCounter: false,
		chargeable: false,
		actions: [
			{
				announceAs: "Curse",
				rank: 3,
				preserveGuard: true,
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
		baseMPCost: 10,
		allowAsCounter: false,
		chargeable: false,
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
	protectiveAura: {
		name: "Protective Aura",
		category: 'strategy',
		targetType: 'allAllies',
		baseMPCost: 40,
		allowAsCounter: false,
		chargeable: false,
		actions: [
			{
				announceAs: "Protective Aura",
				rank: 3,
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
						power: 75,
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
		allowAsCounter: false,
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
				preserveGuard: true,
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
				preserveGuard: true,
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
				preserveGuard: true,
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
		baseMPCost: 5,
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
						power: 5,
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

function powerSpell(name, element, statusID)
{
	return {
		name,
		category: 'magic',
		targetType: 'single',
		baseMPCost: 10,
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
						power: 40,
						element: element,
						addStatus: statusID,
						statusChance: 0,
					},
				],
			},
		],
	};
}
