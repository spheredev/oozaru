/**
 *  Specs Engine: the Spectacles Saga game engine
 *  Copyright © 2012-2024 Where'd She Go? Productions
 *  All rights reserved.
**/

import { from } from 'sphere-runtime';

export default
class Delegate
{
	get [Symbol.toStringTag]() { return 'Delegate'; }

	constructor()
	{
		this._invokeList = [];
	}

	addHandler(handler, thisObj)
	{
		if (haveHandler(this, handler, thisObj))
			throw new Error("cannot add handler more than once");
		this._invokeList.push({ thisObj, handler });
	}

	call(...args)
	{
		let lastResult = undefined;
		for (const entry of this._invokeList)
			lastResult = entry.handler.apply(entry.thisObj, args);

		// use the return value of the last handler called
		return lastResult;
	}

	removeHandler(handler, thisObj)
	{
		if (!haveHandler(this, handler, thisObj))
			throw new Error("handler is not registered");
		from(this._invokeList)
			.where(it => it.handler === handler)
			.where(it => it.thisObj === thisObj)
			.remove();
	}

}

function haveHandler(delegate, handler, thisObj)
{
	return from(delegate._invokeList)
		.any(it => it.handler === handler && it.thisObj === thisObj);
}
