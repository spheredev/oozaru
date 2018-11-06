/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { StatNames, Statuses } from '../gameDef/index.js';

export default
class StatusEffect
{
	constructor(statusID, unit)
	{
		if (!(statusID in Statuses))
			throw new ReferenceError(`no such status '${statusID}'`);

		this.context = {};
		this.name = Statuses[statusID].name;
		this.statusDef = Statuses[statusID];
		this.statusID = statusID;
		this.unit = unit;
		console.log(`initialize status effect ${unit.name}->${this.name}`);
		if ('overrules' in this.statusDef) {
			for (let i = 0; i < this.statusDef.overrules.length; ++i)
				this.unit.liftStatus(this.statusDef.overrules[i]);
		}
		if ('initialize' in this.statusDef)
			this.statusDef.initialize.call(this.context, this.unit);
	}

	beginCycle()
	{
		if ('statModifiers' in this.statusDef) {
			for (const stat in StatNames) {
				let multiplier = stat in this.statusDef.statModifiers
					? this.statusDef.statModifiers[stat]
					: 1.0;
				this.unit.battlerInfo.stats[stat] = Math.round(multiplier * this.unit.battlerInfo.stats[stat]);
			}
		}
	}

	invoke(eventID, data = null)
	{
		if (!(eventID in this.statusDef))
			return;  // no-op if no handler
		console.log(`invoke ${this.unit.name}->${this.name}`, `evt: ${eventID}`);
		this.unit.battle.suspend();
		this.statusDef[eventID].call(this.context, this.unit, data);
		this.unit.battle.resume();
	}

	overrules(statusID)
	{
		if (!('overrules' in this.statusDef))
			return false;
		for (let i = 0; i < this.statusDef.overrules.length; ++i) {
			if (statusID == this.statusDef.overrules[i])
				return true;
		}
		return false;
	}
}
