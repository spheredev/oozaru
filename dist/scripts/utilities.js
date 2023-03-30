/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *            Copyright (c) 2023 Fat Cerberus
***/

export
function clone(o, memo = [])
{
	if (typeof o === 'object' && o !== null) {
		for (let i = 0; i < memo.length; ++i) {
			if (o === memo[i].original)
				return memo[i].dolly;
		}
		let dolly = Array.isArray(o) ? []
			: 'clone' in o && typeof o.clone === 'function' ? o.clone()
			: {};
		memo[memo.length] = { original: o, dolly: dolly };
		if (Array.isArray(o) || !('clone' in o) || typeof o.clone !== 'function') {
			for (const p in o)
				dolly[p] = clone(o[p], memo);
		}
		return dolly;
	}
	else {
		return o;
	}
}

export
function drawTextEx(font, x, y, text, color = Color.White, shadowLength = 0, alignment = 'left')
{
	text = String(text);
	
	const Align =
	{
		'left':   (font, x, text) => x,
		'center': (font, x, text) => x - font.widthOf(text) / 2,
		'right':  (font, x, text) => x - font.widthOf(text),
	};

	let shadowColor = Color.Black.fadeTo(color.a);
	x = Math.trunc(Align[alignment](font, x, text));
	y = Math.trunc(y);
	font.drawText(Surface.Screen, x + shadowLength, y + shadowLength, text, shadowColor);
	font.drawText(Surface.Screen, x, y, text, color);
}

export
function* range(min, max)
{
	for (let value = min; value <= max; ++value)
		yield value;
}
