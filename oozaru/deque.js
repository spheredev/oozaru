export class Deque {
    #backPtr = 0;
    #entries;
    #frontPtr = 0;
    #overflowPtr;
    #stride;
    #vips = [];
    constructor(reserveSize = 8) {
        this.#stride = reserveSize + 1;
        this.#entries = new Array(this.#stride);
        this.#overflowPtr = this.#stride;
    }
    *[Symbol.iterator]() {
        while (!this.empty)
            yield this.shift();
    }
    get empty() {
        return this.#backPtr === this.#frontPtr
            && this.#overflowPtr === this.#stride
            && this.#vips.length === 0;
    }
    get first() {
        return this.#vips.length > 0 ? this.#vips[this.#vips.length - 1]
            : this.#backPtr !== this.#frontPtr ? this.#entries[this.#frontPtr]
                : this.#entries[this.#stride];
    }
    get last() {
        const ptr = this.#backPtr > 0 ? this.#backPtr - 1
            : this.#stride - 1;
        return this.#overflowPtr > this.#stride ? this.#entries[this.#overflowPtr - 1]
            : this.#frontPtr !== this.#backPtr ? this.#entries[ptr]
                : this.#vips[0];
    }
    clear() {
        this.#entries.length = 0;
        this.#stride = 1;
        this.#overflowPtr = 1;
        this.#backPtr = 0;
        this.#frontPtr = 0;
    }
    pop() {
        if (this.#overflowPtr > this.#stride) {
            return this.#entries[--this.#overflowPtr];
        }
        else if (this.#frontPtr !== this.#backPtr) {
            if (--this.#backPtr < 0)
                this.#backPtr = this.#stride - 1;
            return this.#entries[this.#backPtr];
        }
        else {
            return this.#vips.shift();
        }
    }
    push(value) {
        const ringFull = (this.#backPtr + 1) % this.#stride === this.#frontPtr;
        if (ringFull || this.#overflowPtr > this.#stride) {
            this.#entries[this.#overflowPtr++] = value;
        }
        else {
            this.#entries[this.#backPtr++] = value;
            if (this.#backPtr >= this.#stride)
                this.#backPtr = 0;
        }
    }
    shift() {
        if (this.#vips.length > 0) {
            return this.#vips.pop();
        }
        else {
            const value = this.#entries[this.#frontPtr++];
            if (this.#frontPtr >= this.#stride)
                this.#frontPtr = 0;
            if (this.#frontPtr === this.#backPtr) {
                this.#frontPtr = this.#stride % this.#overflowPtr;
                this.#backPtr = 0;
                this.#stride = this.#overflowPtr;
            }
            return value;
        }
    }
    unshift(value) {
        const ringFull = (this.#backPtr + 1) % this.#stride === this.#frontPtr;
        if (!ringFull) {
            if (--this.#frontPtr < 0)
                this.#frontPtr = this.#stride - 1;
            this.#entries[this.#frontPtr] = value;
        }
        else {
            this.#vips.push(value);
        }
    }
}
