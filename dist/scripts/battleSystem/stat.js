/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2021 Fat Cerberus
***/

import { Maths } from '../gameDef/index.js';

export default
class Stat
{
	constructor(baseValue, level = 1, enableGrowth = true, growthRate = 1.0)
	{
		this.baseValue = baseValue;
		this.levelUpTable = [];
		for (let i = 1; i <= 100; ++i) {
			let expNeeded = i > 1 ? Math.ceil(i ** 3 / growthRate) : 0;
			this.levelUpTable[i] = expNeeded;
		}
		this.experience = this.levelUpTable[level];
		this.isGrowable = enableGrowth;
	}

	get level()
	{
		for (let level = 100; level >= 2; --level) {
			if (this.experience >= this.levelUpTable[level])
				return level;
		}
		return 1;
	}

	get value()
	{
		return Math.round(Math.max(Maths.statValue(this.baseValue, this.level), 1));
	}

	grow(experience)
	{
		this.experience = Math.min(Math.max(this.experience + experience, 0), this.levelUpTable[100]);
	}
}
