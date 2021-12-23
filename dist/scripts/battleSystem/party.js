/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2021 Fat Cerberus
***/

import { from } from 'sphere-runtime';

import PartyMember from './partyMember.js';

export default
class Party
{
	constructor(level = 1)
	{
		console.log("initialize party manager");

		this.defaultLevel = level;
		this.members = {};
	}

	get level()
	{
		let memberCount = from(this.members).count();
		if (memberCount > 0) {
			let total = 0;
			for (const member of from(this.members))
				total += member.level;
			return Math.floor(total / memberCount);
		}
		else {
			return this.defaultLevel;
		}
	}

	add(characterID, level = this.level)
	{
		let newMember = new PartyMember(characterID, level);
		this.members[characterID] = newMember;
		console.log(`add PC ${newMember.name} to party`);
	}

	includes(characterID)
	{
		return characterID in this.members;
	}

	remove(characterID)
	{
		from(this.members)
			.where((it, key) => key === characterID)
			.besides(it => console.log(`remove PC ${it.name} from party`))
			.remove();
	}
}
