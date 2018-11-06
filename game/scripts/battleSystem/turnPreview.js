/***
 * Specs Engine v6: Spectacles Saga Game Engine
  *           Copyright (c) 2018 Power-Command
***/

import { Prim, Scene, Thread } from '/game/lib/sphere-runtime.js';

const
	BoxColor = Color.Black.fadeTo(0.75),
	BorderColor = Color.Black.fadeTo(0.85),
	TextColor = Color.Gray,
	TextShadowColor = Color.Black;

export default
class TurnPreview extends Thread
{
	constructor()
	{
		super({ priority: 20 });

		this.entries = {};
		this._fadeness = 1.0;
		this.lastPrediction = null;

		let font = Font.Default;
		let surface = new Surface(160, 16, BoxColor);
		Prim.drawRectangle(surface, 0, 0, 48, 16, 1.0, BorderColor);
		Prim.drawRectangle(surface, 48, 0, 112, 16, 1.0, BorderColor);
		font.drawText(surface, 11, 3, "next:", TextShadowColor);
		font.drawText(surface, 10, 2, "next:", TextColor);
		this.transform = new Transform();
		let shape = new Shape(ShapeType.TriStrip,
			surface,
			new VertexList([
				{ x: 0,   y: 0,  u: 0.0, v: 1.0 },
				{ x: 160, y: 0,  u: 1.0, v: 1.0 },
				{ x: 0,   y: 16, u: 0.0, v: 0.0 },
				{ x: 160, y: 16, u: 1.0, v: 0.0 },
			]));
		this.model = new Model([ shape ]);
	}

	dispose()
	{
		this.stop();
	}

	get fadeness()
	{
		return this._fadeness;
	}

	set fadeness(value)
	{
		if (value !== this._fadeness) {
			this._fadeness = value;
		}
	}

	ensureEntries(unit)
	{
		if (!(unit.tag in this.entries)) {
			let iconColor = unit.isPartyMember() ? Color.RoyalBlue : Color.FireBrick;
			let entry = {
				icon:      new BattlerIcon(unit.name, iconColor),
				turnBoxes: [],
			};
			for (let i = 0; i < 8; ++i)
				entry.turnBoxes[i] = { x: 160, tween: null };
			this.entries[unit.tag] = entry;
		}
	}

	set(prediction)
	{
		let moveEasing = 'easeInOutExpo';
		let moveTime = 15;
		if (this.lastPrediction !== null) {
			for (let i = 0; i < Math.min(this.lastPrediction.length, 7); ++i) {
				let unit = this.lastPrediction[i].unit;
				let turnIndex = this.lastPrediction[i].turnIndex;
				let turnBox = this.entries[unit.tag].turnBoxes[turnIndex];
				if (turnBox.tween !== null)
					turnBox.tween.stop();
				turnBox.tween = new Scene()
					.tween(turnBox, moveTime, moveEasing, { x: 160 });
				turnBox.tween.run();
			}
		}
		this.lastPrediction = prediction;
		for (let i = 0; i < Math.min(prediction.length, 7); ++i) {
			let unit = prediction[i].unit;
			let turnIndex = prediction[i].turnIndex;
			this.ensureEntries(unit);
			let turnBox = this.entries[unit.tag].turnBoxes[turnIndex];
			if (turnBox.tween !== null)
				turnBox.tween.stop();
			turnBox.tween = new Scene()
				.tween(turnBox, moveTime, moveEasing, { x: 48 + i * 16 });
			turnBox.tween.run();
		}
	}

	show()
	{
		if (!this.running) {
			console.log("activate battle screen turn preview");
			this.start();
		}
		new Scene()
			.tween(this, 30, 'easeOutExpo', { fadeness: 0.0 })
			.run();
	}

	on_render()
	{
		let y = -16 * this._fadeness;
		Surface.Screen.clipTo(0, y, 160, 16);
		this.model.transform.identity().translate(0, y);
		this.model.draw();
		for (const id in this.entries) {
			let entry = this.entries[id];
			for (let i = 0; i < entry.turnBoxes.length; ++i) {
				let turnBox = entry.turnBoxes[i];
				entry.icon.drawAt(turnBox.x, y);
			}
		}
		Surface.Screen.clipTo(0, 0, Surface.Screen.width, Surface.Screen.height);
	}
}

class BattlerIcon
{
	constructor(name, color)
	{
		let font = Font.Default;
		let outlineColor = Color.Black.fadeTo(0.25);
		let surface = new Surface(16, 16);
		Prim.drawSolidRectangle(surface, 0, 0, 16, 16, color);
		Prim.drawRectangle(surface, 0, 0, 16, 16, 1, outlineColor);
		font.drawText(surface, 5, 3, name[0], Color.mix(Color.Black, color));
		font.drawText(surface, 4, 2, name[0], Color.mix(Color.White, color));
		let shape = new Shape(ShapeType.TriStrip,
			surface,
			new VertexList([
				{ x: 0,  y: 0,  u: 0.0, v: 1.0 },
				{ x: 16, y: 0,  u: 1.0, v: 1.0 },
				{ x: 0,  y: 16, u: 0.0, v: 0.0 },
				{ x: 16, y: 16, u: 1.0, v: 0.0 },
			]));
		this.model = new Model([ shape ]);
		this.transform = new Transform();
		this.lastX = 0;
		this.lastY = 0;
	}

	drawAt(x, y)
	{
		if (x !== this.lastX || y !== this.lastY) {
			this.model.transform.identity()
				.translate(Math.round(x), Math.round(y));
			this.lastX = x;
			this.lastY = y;
		}
		this.model.draw();
	}
}
