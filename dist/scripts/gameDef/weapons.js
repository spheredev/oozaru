/**
 *  Specs Engine: the Spectacles Saga game engine
 *  Copyright © 2012-2024 Where'd She Go? Productions
 *  All rights reserved.
**/

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
		level: 10,
		techniques: [
			'swordSlash',
			'quickstrike',
		],
	},
	rsbSword: {
		name: "Robert's Sword",
		type: 'sword',
		level: 80,
		techniques: [
			'swordSlash',
			'quickStrike',
			'chargeSlash',
		],
	},
	templeSword: {
		name: "Temple Sword",
		type: 'sword',
		level: 100,
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
		level: 100,
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
		level: 25,
		techniques: [
			'archery',
			'flareShot',
			'chillShot',
		],
	},

	powerBow: {
		name: "Power Bow",
		type: 'bow',
		level: 100,
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
		level: 100,
		techniques: [
			'starToss',
			'starVolley',
		],
	},

	// Staves
	luckyStaff: {
		name: "Lucky Staff",
		type: 'staff',
		level: 100,
		techniques: [
			'whack',
			'whipstaff',
		]
	},
};
