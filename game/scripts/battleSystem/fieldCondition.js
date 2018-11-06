/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { Conditions } from '../gameDef/index.js';

export default
class FieldCondition
{
	constructor(conditionID, battle)
	{
		if (!(conditionID in Conditions))
			throw new ReferenceError(`no such field condition '${conditionID}'`);

		this.battle = battle;
		this.context = {};
		this.name = Conditions[conditionID].name;
		this.conditionDef = Conditions[conditionID];
		this.conditionID = conditionID;
		console.log(`initialize FC context ${this.name}`);
		if ('overrules' in this.conditionDef) {
			for (let i = 0; i < this.conditionDef.overrules.length; ++i)
				this.battle.liftCondition(this.conditionDef.overrules[i]);
		}
		if ('initialize' in this.conditionDef)
			this.conditionDef.initialize.call(this.context, this.battle);
	}

	beginCycle()
	{
		// TODO: implement me? maybe?
	}

	invoke(eventID, data = null)
	{
		if (!(eventID in this.conditionDef))
			return;
		console.log(`invoke FC ${this.name}`, `evt: ${eventID}`);
		this.conditionDef[eventID].call(this.context, this.battle, data);
	}
}
