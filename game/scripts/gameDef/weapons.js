/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

export
const WeaponTypes =
{
	bow: "Bow",
	guitar: "Guitar",
	gun: "Gun",
	staff: "Staff",
	shuriken: "Shuriken",
	sword: "Sword",
};

export
const Weapons =
{
	// Swords
	heirloom: {
		name: "Heirloom",
		type: 'sword',
		level: 1,
		techniques: [
			'swordSlash',
			'quickstrike',
		],
	},
	rsbSword: {
		name: "Robert's Sword",
		type: 'sword',
		level: 50,
		techniques: [
			'swordSlash',
			'quickStrike',
			'chargeSlash',
		],
	},
	templeSword: {
		name: "Temple Sword",
		type: 'sword',
		level: 75,
		techniques: [
			'swordSlash',
			'quickstrike',
			'chargeSlash',
		],
	},

	// Guns
	arsenRifle: {
		name: "Arsen's Rifle",
		type: 'gun',
		level: 1,
		techniques: [
			'potshot',
			'sharpshooter',
			'shootout',
		],
	},

	// Bows
	fireAndIce: {
		name: "Fire & Ice",
		type: 'bow',
		level: 1,
		techniques: [
			'archery',
			'flareShot',
			'chillShot',
		],
	},

	powerBow: {
		name: "Power Bow",
		type: 'bow',
		level: 75,
		techniques: [
			'archery',
			'flareShot',
			'chillShot',
			'joltShot',
			'seismicShot',
		],
	},

	// Shuriken
	risingSun: {
		name: "Rising Sun",
		type: 'shuriken',
		level: 1,
		techniques: [
			'starToss',
			'starVolley',
		],
	},

	// Staves
	luckyStaff: {
		name: "Lucky Staff",
		type: 'staff',
		level: 1,
	},
};
