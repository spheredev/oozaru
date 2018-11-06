/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { Game, Weapons } from '../gameDef/index.js';
import { clone } from '../utilities.js';

import Stance from './stance.js';

export default
class WeaponUsable
{
	constructor(weaponID)
	{
		if (!(weaponID in Weapons))
			throw new ReferenceError(`no weapon definition for '${weaponID}'`);

		this.givesExperience = false;
		this.isUnlimited = true;
		this.weaponDef = clone(Weapons[weaponID]);
		this.isGroupCast = false;
		this.weaponID = weaponID;
		this.name = this.weaponDef.name;
		this.useAiming = false;
		this.allowDeadTarget = false;
	}

	get rank()
	{
		return Game.equipWeaponRank;
	}

	clone()
	{
		let newCopy = new WeaponUsable(this.weaponID);
		return newCopy;
	}

	defaultTargets(user)
	{
		return [ user ];
	}

	isUsable(user, stance = Stance.Attack)
	{
		return stance == Stance.Attack;
	}

	mpCost(user)
	{
		return 0;
	}

	use(unit, targets)
	{
		if (!this.isUsable(unit, unit.stance))
			throw new RangeError(`${unit.name} tried to change weapons, which is not currently possible`);

		console.log(unit.name + " is equipping " + this.name,
			`targ: ${targets.length > 1 ? "[multi]" : targets[0].name}`);
		for (const target of targets)
			target.setWeapon(this.weaponID);
		return null;
	}
}
