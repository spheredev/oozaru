/**
 *  Specs Engine: the Spectacles Saga game engine
 *  Copyright © 2012-2024 Where'd She Go? Productions
 *  All rights reserved.
**/

// Beverly movepool:
// - Munch
// - Fat Slam
// - 10.5
// - Knock Back

import { from, Random, Scene } from 'sphere-runtime';

import { AutoBattler, Stance } from '../battleSystem/index.js';

export default
class BeverlyAI extends AutoBattler
{
	constructor(unit, battle)
	{
		super(unit, battle);

		this.defaultSkill = 'upheaval';

		this.talkCount = 0;
	}

	strategize()
	{
		if (Random.chance(0.25))
			this.queueSkill('fatSlam');
	}

	async on_phaseChanged(newPhase, lastPhase)
	{
		switch (newPhase) {
			case 1:
				this.queueSkill('tenPointFive');
				break;
		}
	}

	on_skillUsed(userID, skillID, stance, targetIDs)
	{
		
	}

	on_unitDamaged(unit, amount, tags, actingUnit)
	{
		if (unit === this.unit && actingUnit !== null) {
			if (from(tags).anyIs('fire'))
				this.queueSkill('knockBack', Stance.Normal, actingUnit.id);
		}
	}

	async on_unitReady(unitID)
	{
		if (unitID === 'beverly') {
			switch (++this.talkCount) {
				case 1:
					await new Scene()
						.talk("Beverly", true, 1.0, Infinity,
							"Funny thing about the rats in Malmagma Manor...",
							"They don't tend to last very long around here for one reason or another. They disappear, and you know, nobody's really sure why!")
						.run();
					break;
				case 2:
					await new Scene()
						.talk("Beverly", true, 1.0, Infinity, "Of course, if I had to guess...")
						.run();
					this.queueSkill('munch', Stance.Normal, 'lauren');
					break;
			}
		}
	}
}
