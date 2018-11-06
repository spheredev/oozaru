/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { Party } from './battleSystem/index.js';
import { Game } from './gameDef/index.js';

export default
class GameSession
{
	static fromFile(fileName)
	{
		// TODO: implement me!
	}

	constructor(difficulty = Difficulty.Standard)
	{
		console.log("initialize new game session", `diff lv: ${difficulty}`);

		this.difficulty = difficulty;
		this.party = new Party(1);
		for (const characterID of Game.initialParty)
			this.party.add(characterID);
		this.battlesSeen = [];
	}
}

export
const Difficulty =
{
	Beginner: 1,
	Standard: 2,
	Proud:    3,
	Critical: 4,
};
