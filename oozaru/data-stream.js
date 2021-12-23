export class DataStream {
    #bytes;
    #ptr = 0;
    #textDec = new TextDecoder();
    #view;
    constructor(buffer) {
        if (ArrayBuffer.isView(buffer))
            this.#bytes = new Uint8Array(buffer.buffer);
        else
            this.#bytes = new Uint8Array(buffer);
        this.#view = new DataView(this.#bytes.buffer);
    }
    get atEOF() {
        return this.#ptr >= this.#bytes.length;
    }
    get bufferSize() {
        return this.#bytes.length;
    }
    get position() {
        return this.#ptr;
    }
    set position(value) {
        if (value > this.#bytes.length)
            throw new RangeError(`Stream position '${value}' is out of range`);
        this.#ptr = value;
    }
    readBytes(numBytes) {
        if (this.#ptr + numBytes > this.#bytes.length)
            throw new Error(`Unable to read ${numBytes} bytes from stream`);
        const bytes = this.#bytes.slice(this.#ptr, this.#ptr + numBytes);
        this.#ptr += numBytes;
        return bytes;
    }
    readFloat32(littleEndian = false) {
        if (this.#ptr + 4 > this.#bytes.length)
            throw new Error(`Unable to read 32-bit float from stream`);
        const value = this.#view.getFloat32(this.#ptr, littleEndian);
        this.#ptr += 4;
        return value;
    }
    readFloat64(littleEndian = false) {
        if (this.#ptr + 8 > this.#bytes.length)
            throw new Error(`Unable to read 64-bit float from stream`);
        const value = this.#view.getFloat64(this.#ptr, littleEndian);
        this.#ptr += 8;
        return value;
    }
    readInt8() {
        if (this.#ptr + 1 > this.#bytes.length)
            throw new Error(`Unable to read 8-bit signed integer from stream`);
        return this.#view.getInt8(this.#ptr++);
    }
    readInt16(littleEndian = false) {
        if (this.#ptr + 2 > this.#bytes.length)
            throw new Error(`Unable to read 16-bit signed integer from stream`);
        const value = this.#view.getInt16(this.#ptr, littleEndian);
        this.#ptr += 2;
        return value;
    }
    readInt32(littleEndian = false) {
        if (this.#ptr + 4 > this.#bytes.length)
            throw new Error(`Unable to read 32-bit signed integer from stream`);
        const value = this.#view.getInt32(this.#ptr, littleEndian);
        this.#ptr += 4;
        return value;
    }
    readString(numBytes) {
        if (this.#ptr + numBytes > this.#bytes.length)
            throw new Error(`Unable to read ${numBytes}-byte string from stream`);
        const slice = this.#bytes.subarray(this.#ptr, this.#ptr + numBytes);
        this.#ptr += numBytes;
        return this.#textDec.decode(slice);
    }
    readStringU8() {
        const length = this.readUint8();
        return this.readString(length);
    }
    readStringU16(littleEndian = false) {
        const length = this.readUint16(littleEndian);
        return this.readString(length);
    }
    readStringU32(littleEndian = false) {
        const length = this.readUint32(littleEndian);
        return this.readString(length);
    }
    readStruct(manifest) {
        let retval = {};
        for (const key of Object.keys(manifest)) {
            const matches = manifest[key].match(/(string|reserve)\/([0-9]*)/);
            const valueType = matches !== null ? matches[1] : manifest[key];
            const numBytes = matches !== null ? parseInt(matches[2], 10) : 0;
            switch (valueType) {
                case 'float32-be':
                    retval[key] = this.readFloat32();
                    break;
                case 'float32-le':
                    retval[key] = this.readFloat32(true);
                    break;
                case 'float64-be':
                    retval[key] = this.readFloat64();
                    break;
                case 'float64-le':
                    retval[key] = this.readFloat64(true);
                    break;
                case 'int8':
                case 'int8-be':
                case 'int8-le':
                    retval[key] = this.readInt8();
                    break;
                case 'int16-be':
                    retval[key] = this.readInt16();
                    break;
                case 'int16-le':
                    retval[key] = this.readInt16(true);
                    break;
                case 'int32-be':
                    retval[key] = this.readInt32();
                    break;
                case 'int32-le':
                    retval[key] = this.readInt32(true);
                    break;
                case 'reserve':
                    retval[key] = null;
                    this.skipAhead(numBytes);
                    break;
                case 'string':
                    retval[key] = this.readString(numBytes);
                    break;
                case 'string8':
                case 'string8-be':
                case 'string8-le':
                    retval[key] = this.readStringU8();
                    break;
                case 'string16-be':
                    retval[key] = this.readStringU16();
                    break;
                case 'string16-le':
                    retval[key] = this.readStringU16(true);
                    break;
                case 'string32-be':
                    retval[key] = this.readStringU32();
                    break;
                case 'string32-le':
                    retval[key] = this.readStringU32(true);
                    break;
                case 'uint8':
                case 'uint8-be':
                case 'uint8-le':
                    retval[key] = this.readUint8();
                    break;
                case 'uint16-be':
                    retval[key] = this.readUint16();
                    break;
                case 'uint16-le':
                    retval[key] = this.readUint16(true);
                    break;
                case 'uint32-be':
                    retval[key] = this.readUint32();
                    break;
                case 'uint32-le':
                    retval[key] = this.readUint32(true);
                    break;
                default:
                    throw new RangeError(`Unknown readStruct() value type '${valueType}'`);
            }
        }
        return retval;
    }
    readUint8() {
        if (this.#ptr + 1 > this.#bytes.length)
            throw new Error(`Unable to read 8-bit unsigned integer from stream`);
        return this.#view.getUint8(this.#ptr++);
    }
    readUint16(littleEndian = false) {
        if (this.#ptr + 2 > this.#bytes.length)
            throw new Error(`Unable to read 16-bit unsigned integer from stream`);
        const value = this.#view.getUint16(this.#ptr, littleEndian);
        this.#ptr += 2;
        return value;
    }
    readUint32(littleEndian = false) {
        if (this.#ptr + 4 > this.#bytes.length)
            throw new Error(`Unable to read 32-bit unsigned integer from stream`);
        const value = this.#view.getUint32(this.#ptr, littleEndian);
        this.#ptr += 4;
        return value;
    }
    skipAhead(numBytes) {
        if (this.#ptr + numBytes > this.#bytes.length)
            throw new Error(`Cannot read ${numBytes} bytes from stream`);
        this.#ptr += numBytes;
    }
}
