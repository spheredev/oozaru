export default
async function main()
{
	let texture = await Texture.fromFile('images/saiyan.png');
	let vbo = new VertexList([
		{ x: -0.75, y: -0.75, u: 0.0, v: 1.0 },
		{ x: +0.75, y: -0.75, u: 1.0, v: 1.0 },
		{ x: -0.75, y: +0.75, u: 0.0, v: 0.0 },
		{ x: +0.75, y: +0.75, u: 1.0, v: 0.0 },
	]);
	let shape = new Shape(ShapeType.TriStrip, texture, vbo);
	Dispatch.onRender(() => {
		shape.draw();
	});
}
