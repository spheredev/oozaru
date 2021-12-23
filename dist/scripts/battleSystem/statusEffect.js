/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2021 Fat Cerberus
***/

import { StatNames, Statuses } from '../gameDef/index.js';

export default
class StatusEffect
{
	constructor(statusID, unit)
	{
		if (!(statusID in Statuses))
			throw new ReferenceError(`no such status '${statusID}'`);

		this.name = Statuses[statusID].name;
		this.statusDef = Statuses[statusID];
		this.statusID = statusID;
		this.unit = unit;
		this.timers = { ...this.statusDef.expiration };
		this.context = {};

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
		if (eventID in this.timers || eventID in this.statusDef)
			console.log(`invoke ${this.unit.name}->${this.name}`, `evt: ${eventID}`);

		// check if the status has expired yet
		if (eventID in this.timers) {
			if (--this.timers[eventID] <= 0) {
				console.log(`${this.unit.name}->${this.name} expired`);
				this.unit.liftStatus(this.statusID);
			}
			else {
				const left = this.timers[eventID];
				console.log(`${this.unit.name}->${this.name} expires in ${left} more ticks`);
			}
		}

		// call the event handler, if one exists
		if (eventID in this.statusDef) {
			this.unit.battle.suspend();
			this.statusDef[eventID].call(this.context, this.unit, data);
			this.unit.battle.resume();
		}
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
