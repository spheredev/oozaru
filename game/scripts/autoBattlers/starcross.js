/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { AutoBattler, Stance } from '../battleSystem/index.js';

export default
class ScottStarcrossAI extends AutoBattler
{
	constructor(battleContext, unit)
	{
		super(battleContext, unit);

		this.definePhases([ 14000, 9000, 4000 ], 100);
		this.defaultSkill = 'swordSlash';
	}

	strategize()
	{
	}

	on_skillUsed(userID, skillID, stance, targetIDs)
	{
		// don't respond if Scott is distracted with something else
		if (this.hasMovesQueued || this.unit.busy)
			return;

		if (skillID === 'jolt' || skillID === 'necromancy') {
			// retaliate against a Zombie infliction by attempting to KO the
			// offending battler.
			this.queueSkill('berserkCharge', Stance.Charge, userID);
			this.queueSkill('immunize');
		}
	}
}
