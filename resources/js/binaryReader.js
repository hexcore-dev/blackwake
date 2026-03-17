class BinaryReader {
    constructor(bytes) {
        this.bytes = bytes;
        this.offset = 0;
    }

    eof() {
        return this.offset >= this.bytes.length;
    }

    // WHAT THE FUCK IS THAT????
    readU32LE() {
        const b = this.bytes;
        const o = this.offset;

        const value =
            (b[o]) |
            (b[o + 1] << 8) |
            (b[o + 2] << 16) |
            (b[o + 3] << 24);

        this.offset += 4;
        return value >>> 0;
    }

    readBytes(length) {
        const out = this.bytes.slice(this.offset, this.offset + length);
        this.offset += length;
        return out;
    }

    readUTF16LEString(charCount) {
        const bytes = this.readBytes(charCount * 2);

        return new TextDecoder("utf-16le").decode(bytes);
    }
}