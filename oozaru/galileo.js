import Fido from './fido.js';
import Game from './game.js';
export var BlendOp;
(function (BlendOp) {
    BlendOp[BlendOp["Default"] = 0] = "Default";
    BlendOp[BlendOp["Add"] = 1] = "Add";
    BlendOp[BlendOp["Average"] = 2] = "Average";
    BlendOp[BlendOp["CopyAlpha"] = 3] = "CopyAlpha";
    BlendOp[BlendOp["CopyRGB"] = 4] = "CopyRGB";
    BlendOp[BlendOp["Invert"] = 5] = "Invert";
    BlendOp[BlendOp["Multiply"] = 6] = "Multiply";
    BlendOp[BlendOp["Replace"] = 7] = "Replace";
    BlendOp[BlendOp["Subtract"] = 8] = "Subtract";
})(BlendOp || (BlendOp = {}));
export var DepthOp;
(function (DepthOp) {
    DepthOp[DepthOp["AlwaysPass"] = 0] = "AlwaysPass";
    DepthOp[DepthOp["Equal"] = 1] = "Equal";
    DepthOp[DepthOp["Greater"] = 2] = "Greater";
    DepthOp[DepthOp["GreaterOrEqual"] = 3] = "GreaterOrEqual";
    DepthOp[DepthOp["Less"] = 4] = "Less";
    DepthOp[DepthOp["LessOrEqual"] = 5] = "LessOrEqual";
    DepthOp[DepthOp["NeverPass"] = 6] = "NeverPass";
    DepthOp[DepthOp["NotEqual"] = 7] = "NotEqual";
})(DepthOp || (DepthOp = {}));
export var ShapeType;
(function (ShapeType) {
    ShapeType[ShapeType["Fan"] = 0] = "Fan";
    ShapeType[ShapeType["Lines"] = 1] = "Lines";
    ShapeType[ShapeType["LineLoop"] = 2] = "LineLoop";
    ShapeType[ShapeType["LineStrip"] = 3] = "LineStrip";
    ShapeType[ShapeType["Points"] = 4] = "Points";
    ShapeType[ShapeType["Triangles"] = 5] = "Triangles";
    ShapeType[ShapeType["TriStrip"] = 6] = "TriStrip";
})(ShapeType || (ShapeType = {}));
var activeShader = null;
var activeSurface = null;
var defaultShader;
var gl;
export default class Galileo {
    static async initialize(canvas) {
        const glContext = canvas.getContext('webgl', { alpha: false });
        if (glContext === null)
            throw new Error(`Couldn't acquire a WebGL rendering context.`);
        gl = glContext;
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clearDepth(1.0);
        gl.blendEquation(glContext.FUNC_ADD);
        gl.blendFunc(glContext.SRC_ALPHA, glContext.ONE_MINUS_SRC_ALPHA);
        gl.depthFunc(glContext.ALWAYS);
        gl.enable(glContext.BLEND);
        gl.enable(glContext.DEPTH_TEST);
        gl.enable(glContext.SCISSOR_TEST);
        defaultShader = await Shader.fromFiles({
            vertexFile: '#/default.vert.glsl',
            fragmentFile: '#/default.frag.glsl',
        });
        Galileo.flip();
    }
    static draw(type, vertices, indices, offset = 0, numVertices) {
        const drawMode = type === ShapeType.Fan ? gl.TRIANGLE_FAN
            : type === ShapeType.Lines ? gl.LINES
                : type === ShapeType.LineLoop ? gl.LINE_LOOP
                    : type === ShapeType.LineStrip ? gl.LINE_STRIP
                        : type === ShapeType.Points ? gl.POINTS
                            : type === ShapeType.TriStrip ? gl.TRIANGLE_STRIP
                                : gl.TRIANGLES;
        vertices.activate();
        if (indices != null) {
            if (numVertices === undefined)
                numVertices = indices.length - offset;
            indices.activate();
            gl.drawElements(drawMode, numVertices, gl.UNSIGNED_SHORT, offset);
        }
        else {
            if (numVertices === undefined)
                numVertices = vertices.length - offset;
            gl.drawArrays(drawMode, offset, numVertices);
        }
    }
    static flip() {
        Surface.Screen.activate(defaultShader);
        Surface.Screen.unclip();
        gl.disable(gl.SCISSOR_TEST);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.SCISSOR_TEST);
    }
    static rerez(width, height) {
        gl.canvas.width = width;
        gl.canvas.height = height;
        Surface.Screen.size = { width, height };
        Surface.Screen.projection = new Transform()
            .project2D(0, 0, width, height);
        if (width <= 400 && height <= 300) {
            gl.canvas.style.width = `${width * 2}px`;
            gl.canvas.style.height = `${height * 2}px`;
        }
        else {
            gl.canvas.style.width = `${width}px`;
            gl.canvas.style.height = `${height}px`;
        }
        if (activeSurface === Surface.Screen)
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }
}
export class Color {
    static get AliceBlue() { return new Color(240 / 255, 248 / 255, 255 / 255, 255 / 255); }
    static get AntiqueWhite() { return new Color(250 / 255, 235 / 255, 215 / 255, 255 / 255); }
    static get Aqua() { return new Color(0 / 255, 255 / 255, 255 / 255, 255 / 255); }
    static get Aquamarine() { return new Color(127 / 255, 255 / 255, 212 / 255, 255 / 255); }
    static get Azure() { return new Color(240 / 255, 255 / 255, 255 / 255, 255 / 255); }
    static get Beige() { return new Color(245 / 255, 245 / 255, 220 / 255, 255 / 255); }
    static get Bisque() { return new Color(255 / 255, 228 / 255, 196 / 255, 255 / 255); }
    static get Black() { return new Color(0 / 255, 0 / 255, 0 / 255, 255 / 255); }
    static get BlanchedAlmond() { return new Color(255 / 255, 235 / 255, 205 / 255, 255 / 255); }
    static get Blue() { return new Color(0 / 255, 0 / 255, 255 / 255, 255 / 255); }
    static get BlueViolet() { return new Color(138 / 255, 43 / 255, 226 / 255, 255 / 255); }
    static get Brown() { return new Color(165 / 255, 42 / 255, 42 / 255, 255 / 255); }
    static get BurlyWood() { return new Color(222 / 255, 184 / 255, 135 / 255, 255 / 255); }
    static get CadetBlue() { return new Color(95 / 255, 158 / 255, 160 / 255, 255 / 255); }
    static get Chartreuse() { return new Color(127 / 255, 255 / 255, 0 / 255, 255 / 255); }
    static get Chocolate() { return new Color(210 / 255, 105 / 255, 30 / 255, 255 / 255); }
    static get Coral() { return new Color(255 / 255, 127 / 255, 80 / 255, 255 / 255); }
    static get CornflowerBlue() { return new Color(100 / 255, 149 / 255, 237 / 255, 255 / 255); }
    static get Cornsilk() { return new Color(255 / 255, 248 / 255, 220 / 255, 255 / 255); }
    static get Crimson() { return new Color(220 / 255, 20 / 255, 60 / 255, 255 / 255); }
    static get Cyan() { return new Color(0 / 255, 255 / 255, 255 / 255, 255 / 255); }
    static get DarkBlue() { return new Color(0 / 255, 0 / 255, 139 / 255, 255 / 255); }
    static get DarkCyan() { return new Color(0 / 255, 139 / 255, 139 / 255, 255 / 255); }
    static get DarkGoldenrod() { return new Color(184 / 255, 134 / 255, 11 / 255, 255 / 255); }
    static get DarkGray() { return new Color(169 / 255, 169 / 255, 169 / 255, 255 / 255); }
    static get DarkGreen() { return new Color(0 / 255, 100 / 255, 0 / 255, 255 / 255); }
    static get DarkKhaki() { return new Color(189 / 255, 183 / 255, 107 / 255, 255 / 255); }
    static get DarkMagenta() { return new Color(139 / 255, 0 / 255, 139 / 255, 255 / 255); }
    static get DarkOliveGreen() { return new Color(85 / 255, 107 / 255, 47 / 255, 255 / 255); }
    static get DarkOrange() { return new Color(255 / 255, 140 / 255, 0 / 255, 255 / 255); }
    static get DarkOrchid() { return new Color(153 / 255, 50 / 255, 204 / 255, 255 / 255); }
    static get DarkRed() { return new Color(139 / 255, 0 / 255, 0 / 255, 255 / 255); }
    static get DarkSalmon() { return new Color(233 / 255, 150 / 255, 122 / 255, 255 / 255); }
    static get DarkSeaGreen() { return new Color(143 / 255, 188 / 255, 143 / 255, 255 / 255); }
    static get DarkSlateBlue() { return new Color(72 / 255, 61 / 255, 139 / 255, 255 / 255); }
    static get DarkSlateGray() { return new Color(47 / 255, 79 / 255, 79 / 255, 255 / 255); }
    static get DarkTurquoise() { return new Color(0 / 255, 206 / 255, 209 / 255, 255 / 255); }
    static get DarkViolet() { return new Color(148 / 255, 0 / 255, 211 / 255, 255 / 255); }
    static get DeepPink() { return new Color(255 / 255, 20 / 255, 147 / 255, 255 / 255); }
    static get DeepSkyBlue() { return new Color(0 / 255, 191 / 255, 255 / 255, 255 / 255); }
    static get DimGray() { return new Color(105 / 255, 105 / 255, 105 / 255, 255 / 255); }
    static get DodgerBlue() { return new Color(30 / 255, 144 / 255, 255 / 255, 255 / 255); }
    static get FireBrick() { return new Color(178 / 255, 34 / 255, 34 / 255, 255 / 255); }
    static get FloralWhite() { return new Color(255 / 255, 250 / 255, 240 / 255, 255 / 255); }
    static get ForestGreen() { return new Color(34 / 255, 139 / 255, 34 / 255, 255 / 255); }
    static get Fuchsia() { return new Color(255 / 255, 0 / 255, 255 / 255, 255 / 255); }
    static get Gainsboro() { return new Color(220 / 255, 220 / 255, 220 / 255, 255 / 255); }
    static get GhostWhite() { return new Color(248 / 255, 248 / 255, 255 / 255, 255 / 255); }
    static get Gold() { return new Color(255 / 255, 215 / 255, 0 / 255, 255 / 255); }
    static get Goldenrod() { return new Color(218 / 255, 165 / 255, 32 / 255, 255 / 255); }
    static get Gray() { return new Color(128 / 255, 128 / 255, 128 / 255, 255 / 255); }
    static get Green() { return new Color(0 / 255, 128 / 255, 0 / 255, 255 / 255); }
    static get GreenYellow() { return new Color(173 / 255, 255 / 255, 47 / 255, 255 / 255); }
    static get Honeydew() { return new Color(240 / 255, 255 / 255, 240 / 255, 255 / 255); }
    static get HotPink() { return new Color(255 / 255, 105 / 255, 180 / 255, 255 / 255); }
    static get IndianRed() { return new Color(205 / 255, 92 / 255, 92 / 255, 255 / 255); }
    static get Indigo() { return new Color(75 / 255, 0 / 255, 130 / 255, 255 / 255); }
    static get Ivory() { return new Color(255 / 255, 255 / 255, 240 / 255, 255 / 255); }
    static get Khaki() { return new Color(240 / 255, 230 / 255, 140 / 255, 255 / 255); }
    static get Lavender() { return new Color(230 / 255, 230 / 255, 250 / 255, 255 / 255); }
    static get LavenderBlush() { return new Color(255 / 255, 240 / 255, 245 / 255, 255 / 255); }
    static get LawnGreen() { return new Color(124 / 255, 252 / 255, 0 / 255, 255 / 255); }
    static get LemonChiffon() { return new Color(255 / 255, 250 / 255, 205 / 255, 255 / 255); }
    static get LightBlue() { return new Color(173 / 255, 216 / 255, 230 / 255, 255 / 255); }
    static get LightCoral() { return new Color(240 / 255, 128 / 255, 128 / 255, 255 / 255); }
    static get LightCyan() { return new Color(224 / 255, 255 / 255, 255 / 255, 255 / 255); }
    static get LightGoldenrodYellow() { return new Color(250 / 255, 250 / 255, 210 / 255, 255 / 255); }
    static get LightGray() { return new Color(211 / 255, 211 / 255, 211 / 255, 255 / 255); }
    static get LightGreen() { return new Color(144 / 255, 238 / 255, 144 / 255, 255 / 255); }
    static get LightPink() { return new Color(255 / 255, 182 / 255, 193 / 255, 255 / 255); }
    static get LightSalmon() { return new Color(255 / 255, 160 / 255, 122 / 255, 255 / 255); }
    static get LightSeaGreen() { return new Color(32 / 255, 178 / 255, 170 / 255, 255 / 255); }
    static get LightSkyBlue() { return new Color(135 / 255, 206 / 255, 250 / 255, 255 / 255); }
    static get LightSlateGray() { return new Color(119 / 255, 136 / 255, 153 / 255, 255 / 255); }
    static get LightSteelBlue() { return new Color(176 / 255, 196 / 255, 222 / 255, 255 / 255); }
    static get LightYellow() { return new Color(255 / 255, 255 / 255, 224 / 255, 255 / 255); }
    static get Lime() { return new Color(0 / 255, 255 / 255, 0 / 255, 255 / 255); }
    static get LimeGreen() { return new Color(50 / 255, 205 / 255, 50 / 255, 255 / 255); }
    static get Linen() { return new Color(250 / 255, 240 / 255, 230 / 255, 255 / 255); }
    static get Magenta() { return new Color(255 / 255, 0 / 255, 255 / 255, 255 / 255); }
    static get Maroon() { return new Color(128 / 255, 0 / 255, 0 / 255, 255 / 255); }
    static get MediumAquamarine() { return new Color(102 / 255, 205 / 255, 170 / 255, 255 / 255); }
    static get MediumBlue() { return new Color(0 / 255, 0 / 255, 205 / 255, 255 / 255); }
    static get MediumOrchid() { return new Color(186 / 255, 85 / 255, 211 / 255, 255 / 255); }
    static get MediumPurple() { return new Color(147 / 255, 112 / 255, 219 / 255, 255 / 255); }
    static get MediumSeaGreen() { return new Color(60 / 255, 179 / 255, 113 / 255, 255 / 255); }
    static get MediumSlateBlue() { return new Color(123 / 255, 104 / 255, 238 / 255, 255 / 255); }
    static get MediumSpringGreen() { return new Color(0 / 255, 250 / 255, 154 / 255, 255 / 255); }
    static get MediumTurquoise() { return new Color(72 / 255, 209 / 255, 204 / 255, 255 / 255); }
    static get MediumVioletRed() { return new Color(199 / 255, 21 / 255, 133 / 255, 255 / 255); }
    static get MidnightBlue() { return new Color(25 / 255, 25 / 255, 112 / 255, 255 / 255); }
    static get MintCream() { return new Color(245 / 255, 255 / 255, 250 / 255, 255 / 255); }
    static get MistyRose() { return new Color(255 / 255, 228 / 255, 225 / 255, 255 / 255); }
    static get Moccasin() { return new Color(255 / 255, 228 / 255, 181 / 255, 255 / 255); }
    static get NavajoWhite() { return new Color(255 / 255, 222 / 255, 173 / 255, 255 / 255); }
    static get Navy() { return new Color(0 / 255, 0 / 255, 128 / 255, 255 / 255); }
    static get OldLace() { return new Color(253 / 255, 245 / 255, 230 / 255, 255 / 255); }
    static get Olive() { return new Color(128 / 255, 128 / 255, 0 / 255, 255 / 255); }
    static get OliveDrab() { return new Color(107 / 255, 142 / 255, 35 / 255, 255 / 255); }
    static get Orange() { return new Color(255 / 255, 165 / 255, 0 / 255, 255 / 255); }
    static get OrangeRed() { return new Color(255 / 255, 69 / 255, 0 / 255, 255 / 255); }
    static get Orchid() { return new Color(218 / 255, 112 / 255, 214 / 255, 255 / 255); }
    static get PaleGoldenrod() { return new Color(238 / 255, 232 / 255, 170 / 255, 255 / 255); }
    static get PaleGreen() { return new Color(152 / 255, 251 / 255, 152 / 255, 255 / 255); }
    static get PaleTurquoise() { return new Color(175 / 255, 238 / 255, 238 / 255, 255 / 255); }
    static get PaleVioletRed() { return new Color(219 / 255, 112 / 255, 147 / 255, 255 / 255); }
    static get PapayaWhip() { return new Color(225 / 255, 239 / 255, 213 / 255, 255 / 255); }
    static get PeachPuff() { return new Color(255 / 255, 218 / 255, 185 / 255, 255 / 255); }
    static get Peru() { return new Color(205 / 255, 133 / 255, 63 / 255, 255 / 255); }
    static get Pink() { return new Color(255 / 255, 192 / 255, 203 / 255, 255 / 255); }
    static get Plum() { return new Color(221 / 255, 160 / 255, 221 / 255, 255 / 255); }
    static get PowderBlue() { return new Color(176 / 255, 224 / 255, 230 / 255, 255 / 255); }
    static get Purple() { return new Color(128 / 255, 0 / 255, 128 / 255, 255 / 255); }
    static get Red() { return new Color(255 / 255, 0 / 255, 0 / 255, 255 / 255); }
    static get RosyBrown() { return new Color(188 / 255, 143 / 255, 143 / 255, 255 / 255); }
    static get RoyalBlue() { return new Color(65 / 255, 105 / 255, 225 / 255, 255 / 255); }
    static get SaddleBrown() { return new Color(139 / 255, 69 / 255, 19 / 255, 255 / 255); }
    static get Salmon() { return new Color(250 / 255, 128 / 255, 114 / 255, 255 / 255); }
    static get SandyBrown() { return new Color(244 / 255, 164 / 255, 96 / 255, 255 / 255); }
    static get SeaGreen() { return new Color(46 / 255, 139 / 255, 87 / 255, 255 / 255); }
    static get Seashell() { return new Color(255 / 255, 245 / 255, 238 / 255, 255 / 255); }
    static get Sienna() { return new Color(160 / 255, 82 / 255, 45 / 255, 255 / 255); }
    static get Silver() { return new Color(192 / 255, 192 / 255, 192 / 255, 255 / 255); }
    static get SkyBlue() { return new Color(135 / 255, 206 / 255, 235 / 255, 255 / 255); }
    static get SlateBlue() { return new Color(106 / 255, 90 / 255, 205 / 255, 255 / 255); }
    static get SlateGray() { return new Color(112 / 255, 128 / 255, 144 / 255, 255 / 255); }
    static get Snow() { return new Color(255 / 255, 250 / 255, 250 / 255, 255 / 255); }
    static get SpringGreen() { return new Color(0 / 255, 255 / 255, 127 / 255, 255 / 255); }
    static get SteelBlue() { return new Color(70 / 255, 130 / 255, 180 / 255, 255 / 255); }
    static get Tan() { return new Color(210 / 255, 180 / 255, 140 / 255, 255 / 255); }
    static get Teal() { return new Color(0 / 255, 128 / 255, 128 / 255, 255 / 255); }
    static get Thistle() { return new Color(216 / 255, 191 / 255, 216 / 255, 255 / 255); }
    static get Tomato() { return new Color(255 / 255, 99 / 255, 71 / 255, 255 / 255); }
    static get Transparent() { return new Color(0 / 255, 0 / 255, 0 / 255, 0 / 255); }
    static get Turquoise() { return new Color(64 / 255, 224 / 255, 208 / 255, 255 / 255); }
    static get Violet() { return new Color(238 / 255, 130 / 255, 238 / 255, 255 / 255); }
    static get Wheat() { return new Color(245 / 255, 222 / 255, 179 / 255, 255 / 255); }
    static get White() { return new Color(255 / 255, 255 / 255, 255 / 255, 255 / 255); }
    static get WhiteSmoke() { return new Color(245 / 255, 245 / 255, 245 / 255, 255 / 255); }
    static get Yellow() { return new Color(255 / 255, 255 / 255, 0 / 255, 255 / 255); }
    static get YellowGreen() { return new Color(154 / 255, 205 / 255, 50 / 255, 255 / 255); }
    static get PurwaBlue() { return new Color(155 / 255, 225 / 255, 255 / 255, 255 / 255); }
    static get RebeccaPurple() { return new Color(102 / 255, 51 / 255, 153 / 255, 255 / 255); }
    static get StankyBean() { return new Color(197 / 255, 162 / 255, 171 / 255, 255 / 255); }
    static is(x, y) {
        return x.r === y.r && x.g === y.g && x.b === y.b;
    }
    static mix(x, y, wx = 1.0, wy = 1.0) {
        const totalWeight = wx + wy;
        wx /= totalWeight;
        wy /= totalWeight;
        return new Color(x.r * wx + y.r * wy, x.g * wx + y.g * wy, x.b * wx + y.b * wy, x.a * wx + y.a * wy);
    }
    static of(name) {
        let matched = name.match(/^#?([0-9a-f]{6})$/i);
        if (matched) {
            const m = matched[1];
            return new Color(parseInt(m.slice(0, 2), 16) / 255.0, parseInt(m.slice(2, 4), 16) / 255.0, parseInt(m.slice(4, 6), 16) / 255.0);
        }
        matched = name.match(/^#?([0-9a-f]{8})$/i);
        if (matched) {
            const m = matched[1];
            return new Color(parseInt(m.slice(2, 4), 16) / 255.0, parseInt(m.slice(4, 6), 16) / 255.0, parseInt(m.slice(6, 8), 16) / 255.0, parseInt(m.slice(0, 2), 16) / 255.0);
        }
        const toMatch = name.toUpperCase();
        for (const colorName in Color) {
            if (colorName.toUpperCase() === toMatch) {
                try {
                    let propValue = Color[colorName];
                    if (propValue instanceof Color)
                        return propValue;
                }
                catch { }
                break;
            }
        }
        throw new RangeError(`Invalid color designation '${name}'`);
    }
    r;
    g;
    b;
    a;
    constructor(r, g, b, a = 1.0) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }
    get name() {
        throw new Error(`The Color#name API is not implemented.`);
    }
    clone() {
        return new Color(this.r, this.g, this.b, this.a);
    }
    fadeTo(alphaFactor) {
        return new Color(this.r, this.g, this.b, this.a * alphaFactor);
    }
    toVector() {
        return [this.r, this.g, this.b, this.a];
    }
}
export class IndexList {
    glBuffer = null;
    length = 0;
    constructor(indices) {
        this.glBuffer = gl.createBuffer();
        if (this.glBuffer === null)
            throw new Error(`Engine couldn't create a WebGL buffer object.`);
        this.upload(indices);
    }
    activate() {
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glBuffer);
    }
    upload(indices) {
        const values = new Uint16Array(indices);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, values, gl.STREAM_DRAW);
        this.length = values.length;
    }
}
export class Model {
    shapes;
    shader_;
    transform_;
    constructor(shapes, shader = Shader.Default) {
        this.shapes = [...shapes];
        this.shader_ = shader;
        this.transform_ = new Transform();
    }
    get shader() {
        return this.shader_;
    }
    get transform() {
        return this.transform_;
    }
    set shader(value) {
        this.shader_ = value;
    }
    set transform(value) {
        this.transform_ = value;
    }
    draw(surface = Surface.Screen) {
        for (const shape of this.shapes)
            shape.draw(surface, this.transform_, this.shader_);
    }
}
export class Shader {
    static get Default() {
        return defaultShader;
    }
    static fromFiles(options) {
        return new Shader(options).whenReady();
    }
    complete = false;
    exception;
    fragmentShaderSource = "";
    glFragmentShader;
    glProgram;
    glVertexShader;
    modelViewMatrix = Transform.Identity;
    projection = Transform.Identity;
    promise = null;
    uniformIDs = {};
    vertexShaderSource = "";
    valuesToSet = {};
    constructor(options) {
        const program = gl.createProgram();
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        if (program === null || vertexShader === null || fragmentShader === null)
            throw new Error(`Engine couldn't create a WebGL shader object.`);
        this.glProgram = program;
        this.glVertexShader = vertexShader;
        this.glFragmentShader = fragmentShader;
        if ('vertexFile' in options && options.vertexFile !== undefined) {
            const vertexURL = Game.urlOf(options.vertexFile);
            const fragmentURL = Game.urlOf(options.fragmentFile);
            this.promise = Promise.all([
                Fido.fetchText(vertexURL),
                Fido.fetchText(fragmentURL),
            ]).then((responses) => {
                this.compile(responses[0], responses[1]);
            }, (error) => {
                this.exception = error;
            });
        }
        else if ('vertexSource' in options && options.vertexSource !== undefined) {
            this.compile(options.vertexSource, options.fragmentSource);
        }
        else {
            throw RangeError("'new Shader()' was called without either filenames or shader sources.");
        }
    }
    get ready() {
        if (this.exception !== undefined)
            throw this.exception;
        if (this.complete)
            this.promise = null;
        return this.complete;
    }
    activate(useTexture) {
        this.checkIfReady();
        if (activeShader !== this) {
            gl.useProgram(this.glProgram);
            for (const name of Object.keys(this.valuesToSet)) {
                const entry = this.valuesToSet[name];
                let location = this.uniformIDs[name];
                if (location === undefined) {
                    location = gl.getUniformLocation(this.glProgram, name);
                    this.uniformIDs[name] = location;
                }
                let size;
                switch (entry.type) {
                    case 'boolean':
                        gl.uniform1i(location, entry.value ? 1 : 0);
                        break;
                    case 'float':
                        gl.uniform1f(location, entry.value);
                        break;
                    case 'floatArray':
                        gl.uniform1fv(location, entry.value);
                        break;
                    case 'floatVector':
                        size = entry.value.length;
                        size === 4 ? gl.uniform4fv(location, entry.value)
                            : size === 3 ? gl.uniform3fv(location, entry.value)
                                : size === 2 ? gl.uniform2fv(location, entry.value)
                                    : gl.uniform1fv(location, entry.value);
                        break;
                    case 'int':
                        gl.uniform1i(location, entry.value);
                        break;
                    case 'intArray':
                        gl.uniform1iv(location, entry.value);
                        break;
                    case 'intVector':
                        size = entry.value.length;
                        size === 4 ? gl.uniform4iv(location, entry.value)
                            : size === 3 ? gl.uniform3iv(location, entry.value)
                                : size === 2 ? gl.uniform2iv(location, entry.value)
                                    : gl.uniform1iv(location, entry.value);
                        break;
                    case 'matrix':
                        gl.uniformMatrix4fv(location, false, entry.value.values);
                        break;
                }
            }
            this.valuesToSet = {};
            activeShader = this;
        }
        this.setBoolean('al_use_tex', useTexture);
    }
    checkIfReady() {
        if (this.promise !== null)
            throw Error(`Shader was used before checking if it was ready.`);
    }
    clone() {
        this.checkIfReady();
        return new Shader({
            vertexSource: this.vertexShaderSource,
            fragmentSource: this.fragmentShaderSource,
        });
    }
    compile(vertexShaderSource, fragmentShaderSource) {
        gl.shaderSource(this.glVertexShader, vertexShaderSource);
        gl.shaderSource(this.glFragmentShader, fragmentShaderSource);
        gl.compileShader(this.glVertexShader);
        if (!gl.getShaderParameter(this.glVertexShader, gl.COMPILE_STATUS)) {
            const message = gl.getShaderInfoLog(this.glVertexShader);
            throw Error(`Couldn't compile WebGL vertex shader.\n${message}`);
        }
        gl.compileShader(this.glFragmentShader);
        if (!gl.getShaderParameter(this.glFragmentShader, gl.COMPILE_STATUS)) {
            const message = gl.getShaderInfoLog(this.glFragmentShader);
            throw Error(`Couldn't compile WebGL fragment shader.\n${message}`);
        }
        gl.attachShader(this.glProgram, this.glVertexShader);
        gl.attachShader(this.glProgram, this.glFragmentShader);
        gl.bindAttribLocation(this.glProgram, 0, 'al_pos');
        gl.bindAttribLocation(this.glProgram, 1, 'al_color');
        gl.bindAttribLocation(this.glProgram, 2, 'al_texcoord');
        gl.linkProgram(this.glProgram);
        if (!gl.getProgramParameter(this.glProgram, gl.LINK_STATUS)) {
            const message = gl.getProgramInfoLog(this.glProgram);
            throw Error(`Couldn't link WebGL shader program.\n${message}`);
        }
        this.vertexShaderSource = vertexShaderSource;
        this.fragmentShaderSource = fragmentShaderSource;
        this.uniformIDs = {};
        this.complete = true;
        const transformation = this.modelViewMatrix.clone()
            .compose(this.projection);
        this.setMatrix('al_projview_matrix', transformation);
        this.setInt('al_tex', 0);
    }
    project(matrix) {
        this.projection = matrix.clone();
        let transformation = this.modelViewMatrix.clone()
            .compose(this.projection);
        this.setMatrix('al_projview_matrix', transformation);
    }
    setBoolean(name, value) {
        if (activeShader === this) {
            let location = this.uniformIDs[name];
            if (location === undefined) {
                location = gl.getUniformLocation(this.glProgram, name);
                this.uniformIDs[name] = location;
            }
            gl.uniform1i(location, value ? 1 : 0);
        }
        else {
            this.valuesToSet[name] = { type: 'boolean', value };
        }
    }
    setColorVector(name, color) {
        this.setFloatVector(name, color.toVector());
    }
    setFloat(name, value) {
        if (activeShader === this) {
            let location = this.uniformIDs[name];
            if (location === undefined) {
                location = gl.getUniformLocation(this.glProgram, name);
                this.uniformIDs[name] = location;
            }
            gl.uniform1f(location, value);
        }
        else {
            this.valuesToSet[name] = { type: 'float', value };
        }
    }
    setFloatArray(name, values) {
        if (activeShader === this) {
            let location = this.uniformIDs[name];
            if (location === undefined) {
                location = gl.getUniformLocation(this.glProgram, name);
                this.uniformIDs[name] = location;
            }
            gl.uniform1fv(location, values);
        }
        else {
            this.valuesToSet[name] = { type: 'floatArray', value: values };
        }
    }
    setFloatVector(name, values) {
        if (activeShader === this) {
            let location = this.uniformIDs[name];
            if (location === undefined) {
                location = gl.getUniformLocation(this.glProgram, name);
                this.uniformIDs[name] = location;
            }
            const size = values.length;
            size === 4 ? gl.uniform4fv(location, values)
                : size === 3 ? gl.uniform3fv(location, values)
                    : size === 2 ? gl.uniform2fv(location, values)
                        : gl.uniform1fv(location, values);
        }
        else {
            this.valuesToSet[name] = { type: 'floatVector', value: values };
        }
    }
    setInt(name, value) {
        if (activeShader === this) {
            let location = this.uniformIDs[name];
            if (location === undefined) {
                location = gl.getUniformLocation(this.glProgram, name);
                this.uniformIDs[name] = location;
            }
            gl.uniform1i(location, value);
        }
        else {
            this.valuesToSet[name] = { type: 'int', value };
        }
    }
    setIntArray(name, values) {
        if (activeShader === this) {
            let location = this.uniformIDs[name];
            if (location === undefined) {
                location = gl.getUniformLocation(this.glProgram, name);
                this.uniformIDs[name] = location;
            }
            gl.uniform1iv(location, values);
        }
        else {
            this.valuesToSet[name] = { type: 'intArray', value: values };
        }
    }
    setIntVector(name, values) {
        if (activeShader === this) {
            let location = this.uniformIDs[name];
            if (location === undefined) {
                location = gl.getUniformLocation(this.glProgram, name);
                this.uniformIDs[name] = location;
            }
            const size = values.length;
            size === 4 ? gl.uniform4iv(location, values)
                : size === 3 ? gl.uniform3iv(location, values)
                    : size === 2 ? gl.uniform2iv(location, values)
                        : gl.uniform1iv(location, values);
        }
        else {
            this.valuesToSet[name] = { type: 'intVector', value: values };
        }
    }
    setMatrix(name, value) {
        if (activeShader === this) {
            let location = this.uniformIDs[name];
            if (location === undefined) {
                location = gl.getUniformLocation(this.glProgram, name);
                this.uniformIDs[name] = location;
            }
            gl.uniformMatrix4fv(location, false, value.values);
        }
        else {
            this.valuesToSet[name] = { type: 'matrix', value };
        }
    }
    transform(matrix) {
        this.modelViewMatrix = matrix.clone();
        let transformation = this.modelViewMatrix.clone()
            .compose(this.projection);
        this.setMatrix('al_projview_matrix', transformation);
    }
    async whenReady() {
        if (this.exception !== undefined)
            throw this.exception;
        if (this.promise !== null) {
            await this.promise;
            if (this.exception !== undefined)
                throw this.exception;
            this.promise = null;
        }
        return this;
    }
}
export class Shape {
    static drawImmediate(surface, type, arg1, arg2) {
        if (arg1 instanceof Texture || arg1 === null) {
            surface.activate(defaultShader, arg1);
            Galileo.draw(type, new VertexList(arg2));
        }
        else {
            surface.activate(defaultShader);
            Galileo.draw(type, new VertexList(arg1));
        }
    }
    indices;
    texture_;
    type;
    vertices;
    constructor(type, arg1, arg2 = null, arg3 = null) {
        this.type = type;
        if (arg2 instanceof VertexList) {
            if (!(arg1 instanceof Texture) && arg1 != undefined)
                throw new Error("Expected a Texture or 'null' as second argument to Shape constructor");
            this.vertices = arg2;
            this.indices = arg3;
            this.texture_ = arg1;
        }
        else {
            if (!(arg1 instanceof VertexList))
                throw new Error("Expected a VertexList or Texture as second argument to Shape constructor");
            this.vertices = arg1;
            this.indices = arg2;
            this.texture_ = null;
        }
    }
    get indexList() {
        return this.indices;
    }
    get texture() {
        return this.texture_;
    }
    get vertexList() {
        return this.vertices;
    }
    set indexList(value) {
        if (value !== null && !(value instanceof IndexList))
            throw TypeError("Shape#indexList must be set to an IndexList object or 'null'.");
        this.indices = value;
    }
    set texture(value) {
        if (value !== null && !(value instanceof Texture))
            throw TypeError("Shape#texture must be set to a Texture object or 'null'.");
        this.texture_ = value;
    }
    set vertexList(value) {
        if (!(value instanceof VertexList))
            throw TypeError("Shape#vertexList must be set to a VertexList object.");
        this.vertices = value;
    }
    draw(surface = Surface.Screen, transform = Transform.Identity, shader = Shader.Default) {
        surface.activate(shader, this.texture_, transform);
        Galileo.draw(this.type, this.vertices, this.indices);
    }
}
export class Texture {
    static fromFile(fileName) {
        return new Texture(fileName).whenReady();
    }
    exception;
    fileName;
    glTexture;
    promise = null;
    size = { width: 0, height: 0 };
    constructor(...args) {
        const glTexture = gl.createTexture();
        if (glTexture === null)
            throw new Error(`Engine couldn't create a WebGL texture object.`);
        this.glTexture = glTexture;
        if (typeof args[0] === 'string') {
            this.fileName = Game.urlOf(args[0]);
            this.promise = Fido.fetchImage(this.fileName).then((image) => {
                const oldBinding = gl.getParameter(gl.TEXTURE_BINDING_2D);
                gl.bindTexture(gl.TEXTURE_2D, glTexture);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.bindTexture(gl.TEXTURE_2D, oldBinding);
                this.size = { width: image.width, height: image.height };
            }, (error) => {
                this.exception = error;
            });
        }
        else {
            const oldBinding = gl.getParameter(gl.TEXTURE_BINDING_2D);
            gl.bindTexture(gl.TEXTURE_2D, glTexture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
            if (args[0] instanceof HTMLImageElement) {
                const image = args[0];
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                this.size = { width: args[0].width, height: args[0].height };
            }
            else if (typeof args[0] === 'number' && typeof args[1] === 'number') {
                const width = args[0];
                const height = args[1];
                if (width < 1 || height < 1)
                    throw RangeError("A texture cannot be less than one pixel in size.");
                if (args[2] instanceof ArrayBuffer || ArrayBuffer.isView(args[2])) {
                    const buffer = args[2] instanceof ArrayBuffer ? args[2] : args[2].buffer;
                    if (buffer.byteLength < width * height * 4)
                        throw RangeError(`The provided buffer is too small to initialize a ${width}x${height} texture.`);
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(buffer));
                }
                else {
                    const pixels = new Uint32Array(width * height);
                    if (args[2] !== undefined)
                        pixels.fill((args[2].a * 255 << 24) + (args[2].b * 255 << 16) + (args[2].g * 255 << 8) + (args[2].r * 255));
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(pixels.buffer));
                }
                this.size = { width, height };
            }
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.bindTexture(gl.TEXTURE_2D, oldBinding);
        }
    }
    get height() {
        this.checkIfReady();
        return this.size.height;
    }
    get ready() {
        if (this.exception !== undefined)
            throw this.exception;
        const isReady = this.size.width > 0;
        if (isReady)
            this.promise = null;
        return isReady;
    }
    get width() {
        this.checkIfReady();
        return this.size.width;
    }
    checkIfReady() {
        if (this.promise !== null)
            throw Error(`Texture from file '${this.fileName}' was used without a ready check.`);
    }
    upload(content, x = 0, y = 0, width = this.width, height = this.height) {
        this.checkIfReady();
        const pixelData = ArrayBuffer.isView(content)
            ? new Uint8Array(content.buffer)
            : new Uint8Array(content);
        gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, x, this.size.height - y - height, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);
    }
    useTexture(textureUnit = 0) {
        this.checkIfReady();
        gl.activeTexture(gl.TEXTURE0 + textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, this.glTexture);
    }
    async whenReady() {
        if (this.exception !== undefined)
            throw this.exception;
        if (this.promise !== null) {
            await this.promise;
            if (this.exception !== undefined)
                throw this.exception;
            this.promise = null;
        }
        return this;
    }
}
export class Surface extends Texture {
    blendOp_ = BlendOp.Default;
    clipRectangle;
    depthOp_ = DepthOp.AlwaysPass;
    frameBuffer;
    projection;
    static get Screen() {
        const screenSurface = Object.create(Surface.prototype);
        screenSurface.size = { width: gl.canvas.width, height: gl.canvas.height };
        screenSurface.blendOp_ = BlendOp.Default;
        screenSurface.clipRectangle = { x: 0, y: 0, w: gl.canvas.width, h: gl.canvas.height };
        screenSurface.depthOp_ = DepthOp.AlwaysPass;
        screenSurface.frameBuffer = null;
        screenSurface.projection = new Transform()
            .project2D(0, 0, gl.canvas.width, gl.canvas.height);
        screenSurface.promise = null;
        Object.defineProperty(Surface, 'Screen', {
            value: screenSurface,
            writable: false,
            enumerable: false,
            configurable: true,
        });
        return screenSurface;
    }
    static async fromFile(fileName) {
        const url = Game.urlOf(fileName);
        const image = await Fido.fetchImage(url);
        return new Surface(image);
    }
    constructor(...args) {
        if (typeof args[0] === 'string')
            throw RangeError("new Surface() doesn't support background loading.");
        super(...args);
        const frameBuffer = gl.createFramebuffer();
        const depthBuffer = gl.createRenderbuffer();
        if (frameBuffer === null || depthBuffer === null)
            throw new Error(`Engine couldn't create a WebGL framebuffer object.`);
        const previousFBO = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.glTexture, 0);
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
        gl.bindFramebuffer(gl.FRAMEBUFFER, previousFBO);
        this.clipRectangle = { x: 0, y: 0, w: this.width, h: this.height };
        this.frameBuffer = frameBuffer;
        this.projection = new Transform()
            .project2D(0, 0, this.width, this.height);
    }
    get blendOp() {
        return this.blendOp_;
    }
    get depthOp() {
        return this.depthOp_;
    }
    get transform() {
        return this.projection;
    }
    set blendOp(value) {
        this.blendOp_ = value;
        if (activeSurface === this)
            applyBlendOp(value);
    }
    set depthOp(value) {
        this.depthOp_ = value;
        if (activeSurface === this)
            applyDepthOp(value);
    }
    set transform(value) {
        this.projection = value;
    }
    activate(shader, texture = null, transform = Transform.Identity) {
        if (this !== activeSurface) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
            gl.viewport(0, 0, this.width, this.height);
            gl.scissor(this.clipRectangle.x, this.clipRectangle.y, this.clipRectangle.w, this.clipRectangle.h);
            applyBlendOp(this.blendOp_);
            applyDepthOp(this.depthOp_);
            activeSurface = this;
        }
        shader.activate(texture !== null);
        shader.project(this.projection);
        shader.transform(transform);
        texture?.useTexture(0);
    }
    clipTo(x, y, width, height) {
        this.clipRectangle.x = x;
        this.clipRectangle.y = y;
        this.clipRectangle.w = width;
        this.clipRectangle.h = height;
        if (this === activeSurface)
            gl.scissor(x, this.height - y - height, width, height);
    }
    unclip() {
        this.clipTo(0, 0, this.width, this.height);
    }
}
export class Transform {
    values;
    static get Identity() {
        return new this([
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0,
        ]);
    }
    static get Zero() {
        return new this([
            0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0,
            0.0, 0.0, 0.0, 0.0,
        ]);
    }
    constructor(values) {
        if (values !== undefined) {
            if (values.length !== 16)
                throw RangeError("new Transform() requires a 16-element array of numbers as input.");
            this.values = new Float32Array(values);
        }
        else {
            this.values = new Float32Array([
                1.0, 0.0, 0.0, 0.0,
                0.0, 1.0, 0.0, 0.0,
                0.0, 0.0, 1.0, 0.0,
                0.0, 0.0, 0.0, 1.0,
            ]);
        }
    }
    clone() {
        return new Transform(this.values);
    }
    compose(other) {
        const m1 = this.values;
        const m2 = other.values;
        const a00 = m2[0], a01 = m2[1], a02 = m2[2], a03 = m2[3];
        const a10 = m2[4], a11 = m2[5], a12 = m2[6], a13 = m2[7];
        const a20 = m2[8], a21 = m2[9], a22 = m2[10], a23 = m2[11];
        const a30 = m2[12], a31 = m2[13], a32 = m2[14], a33 = m2[15];
        const b00 = m1[0], b01 = m1[1], b02 = m1[2], b03 = m1[3];
        const b10 = m1[4], b11 = m1[5], b12 = m1[6], b13 = m1[7];
        const b20 = m1[8], b21 = m1[9], b22 = m1[10], b23 = m1[11];
        const b30 = m1[12], b31 = m1[13], b32 = m1[14], b33 = m1[15];
        m1[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
        m1[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
        m1[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
        m1[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
        m1[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
        m1[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
        m1[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
        m1[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
        m1[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
        m1[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
        m1[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
        m1[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
        m1[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
        m1[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
        m1[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
        m1[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;
        return this;
    }
    identity() {
        this.values.set([
            1.0, 0.0, 0.0, 0.0,
            0.0, 1.0, 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0,
        ]);
        return this;
    }
    project2D(left, top, right, bottom, near = -1.0, far = 1.0) {
        const deltaX = right - left;
        const deltaY = top - bottom;
        const deltaZ = far - near;
        const projection = Transform.Zero;
        const values = projection.values;
        values[0] = 2.0 / deltaX;
        values[5] = 2.0 / deltaY;
        values[10] = 2.0 / deltaZ;
        values[15] = 1.0;
        values[12] = -(right + left) / deltaX;
        values[13] = -(top + bottom) / deltaY;
        values[14] = -(far + near) / deltaZ;
        return this.compose(projection);
    }
    project3D(fov, aspect, near, far) {
        const fh = Math.tan(fov * Math.PI / 360.0) * near;
        const fw = fh * aspect;
        const deltaX = fw - -fw;
        const deltaY = -fh - fh;
        const deltaZ = far - near;
        const projection = Transform.Zero;
        const values = projection.values;
        values[0] = 2.0 * near / deltaX;
        values[5] = 2.0 * near / deltaY;
        values[8] = (fw + -fw) / deltaX;
        values[9] = (-fh + fh) / deltaY;
        values[10] = -(far + near) / deltaZ;
        values[11] = -1.0;
        values[14] = -2.0 * far * near / deltaZ;
        values[15] = 0.0;
        return this.compose(projection);
    }
    rotate(angle, vX, vY, vZ) {
        const norm = Math.sqrt(vX * vX + vY * vY + vZ * vZ);
        if (norm > 0.0) {
            vX = vX / norm;
            vY = vY / norm;
            vZ = vZ / norm;
        }
        const theta = angle * Math.PI / 180.0;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        const siv = 1.0 - cos;
        const rotation = Transform.Zero;
        const values = rotation.values;
        values[0] = (siv * vX * vX) + cos;
        values[1] = (siv * vX * vY) + (vZ * sin);
        values[2] = (siv * vX * vZ) - (vY * sin);
        values[4] = (siv * vX * vY) - (vZ * sin);
        values[5] = (siv * vY * vY) + cos;
        values[6] = (siv * vZ * vY) + (vX * sin);
        values[8] = (siv * vX * vZ) + (vY * sin);
        values[9] = (siv * vY * vZ) - (vX * sin);
        values[10] = (siv * vZ * vZ) + cos;
        values[15] = 1.0;
        return this.compose(rotation);
    }
    scale(sX, sY, sZ = 1.0) {
        this.values[0] *= sX;
        this.values[4] *= sX;
        this.values[8] *= sX;
        this.values[12] *= sX;
        this.values[1] *= sY;
        this.values[5] *= sY;
        this.values[9] *= sY;
        this.values[13] *= sY;
        this.values[2] *= sZ;
        this.values[6] *= sZ;
        this.values[10] *= sZ;
        this.values[14] *= sZ;
        return this;
    }
    translate(tX, tY, tZ = 0.0) {
        this.values[12] += tX;
        this.values[13] += tY;
        this.values[14] += tZ;
        return this;
    }
}
export class VertexList {
    glBuffer = null;
    length = 0;
    constructor(vertices) {
        this.glBuffer = gl.createBuffer();
        if (this.glBuffer === null)
            throw new Error(`Engine couldn't create a WebGL buffer object.`);
        this.upload(vertices);
    }
    activate() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 40, 0);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 40, 16);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 40, 32);
    }
    upload(vertices) {
        const data = new Float32Array(10 * vertices.length);
        for (let i = 0, len = vertices.length; i < len; ++i) {
            const vertex = vertices[i];
            data[0 + i * 10] = vertex.x;
            data[1 + i * 10] = vertex.y;
            data[2 + i * 10] = vertex.z ?? 0.0;
            data[3 + i * 10] = 1.0;
            data[4 + i * 10] = vertex.color?.r ?? 1.0;
            data[5 + i * 10] = vertex.color?.g ?? 1.0;
            data[6 + i * 10] = vertex.color?.b ?? 1.0;
            data[7 + i * 10] = vertex.color?.a ?? 1.0;
            data[8 + i * 10] = vertex.u ?? 0.0;
            data[9 + i * 10] = vertex.v ?? 0.0;
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
        this.length = vertices.length;
    }
}
function applyBlendOp(op) {
    switch (op) {
        case BlendOp.Default:
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            break;
        case BlendOp.Add:
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFunc(gl.ONE, gl.ONE);
            break;
        case BlendOp.Average:
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFunc(gl.CONSTANT_COLOR, gl.CONSTANT_COLOR);
            gl.blendColor(0.5, 0.5, 0.5, 0.5);
            break;
        case BlendOp.CopyAlpha:
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFuncSeparate(gl.ZERO, gl.ONE, gl.ONE, gl.ZERO);
            break;
        case BlendOp.CopyRGB:
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFuncSeparate(gl.ONE, gl.ZERO, gl.ZERO, gl.ONE);
            break;
        case BlendOp.Invert:
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR);
            break;
        case BlendOp.Multiply:
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFunc(gl.DST_COLOR, gl.ZERO);
            break;
        case BlendOp.Replace:
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFunc(gl.ONE, gl.ZERO);
            break;
        case BlendOp.Subtract:
            gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
            gl.blendFunc(gl.ONE, gl.ONE);
            break;
        default:
            gl.blendEquation(gl.FUNC_ADD);
            gl.blendFunc(gl.ZERO, gl.ZERO);
    }
}
function applyDepthOp(op) {
    const depthFunc = op === DepthOp.AlwaysPass ? gl.ALWAYS
        : op === DepthOp.Equal ? gl.EQUAL
            : op === DepthOp.Greater ? gl.GREATER
                : op === DepthOp.GreaterOrEqual ? gl.GEQUAL
                    : op === DepthOp.Less ? gl.LESS
                        : op === DepthOp.LessOrEqual ? gl.LEQUAL
                            : op === DepthOp.NotEqual ? gl.NOTEQUAL
                                : gl.NEVER;
    gl.depthFunc(depthFunc);
}
