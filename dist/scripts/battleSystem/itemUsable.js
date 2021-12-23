/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2021 Fat Cerberus
***/

import { from } from 'sphere-runtime';

import { Game, Items } from '../gameDef/index.js';
import { clone } from '../utilities.js';

import { Stance } from './battleUnit.js';

export default
class ItemUsable
{
	constructor(itemID)
	{
		if (!(itemID in Items))
			throw new ReferenceError(`no such item '${itemID}'`);

		this.canGroupCast = false;
		this.givesExperience = false;
		this.isUnlimited = false;
		this.itemDef = clone(Items[itemID]);
		if (!('rank' in this.itemDef.action))
			this.itemDef.action.rank = Game.defaultItemRank;
		this.isGroupCast = false;
		this.itemID = itemID;
		this.name = this.itemDef.name;
		this.useAiming = false;
		this.allowDeadTarget = 'allowDeadTarget' in this.itemDef
			? this.itemDef.allowDeadTarget
			: false;
		this.usesLeft = 'uses' in this.itemDef ? this.itemDef.uses : 1;
	}

	get rank()
	{
		return 'rank' in this.itemDef.action ? this.itemDef.action.rank
			: Game.defaultItemRank;
	}

	clone()
	{
		let newCopy = new ItemUsable(this.itemID);
		newCopy.usesLeft = this.usesLeft;
		return newCopy;
	}

	defaultTargets(user)
	{
		let target = user;
		let allies = user.battle.alliesOf(user);
		if (this.allowDeadTarget && from(allies).any(unit => !unit.isAlive())) {
			target = from(allies)
				.where(unit => !unit.isAlive())
				.sample(1).first();
		}
		return [ target ];
	}

	isUsable(user, stance = Stance.Normal)
	{
		return (this.isUnlimited || this.usesLeft > 0)
			&& stance == Stance.Normal;
	}

	mpCost(user)
	{
		return 0;
	}

	peekActions()
	{
		return [ this.itemDef.action ];
	}

	use(unit, targets)
	{
		if (!this.isUsable(unit, unit.stance))
			throw new Error(`${unit.name} tried to use unusable item ${this.name}`);
		--this.usesLeft;
		console.log(`${unit.name} is using ${this.name}`,
			`targ: ${targets.length > 1 ? "[multi]" : targets[0].name}`,
			`left: ${this.usesLeft}`);
		let eventData = { item: clone(this.itemDef) };
		unit.raiseEvent('useItem', eventData);
		unit.battle.notifyAIs('itemUsed', unit.id, this.itemID, from(targets).select(it => it.id).toArray());
		return [ eventData.item.action ];
	}
}
