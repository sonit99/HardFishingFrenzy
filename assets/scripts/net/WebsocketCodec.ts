import { jspb } from "./WsUtil";

export class WsEncoder {

    private _buffer: Array<number>;

    static _instance: WsEncoder;

    public constructor() {
        this._buffer = new Array<number>();
    }

    public static getInstance(): WsEncoder {
        if (!this._instance) {
            this._instance = new WsEncoder();
        }
        return this._instance;
    }

    public init(): WsEncoder {
        this._buffer = new Array<number>();
        return this;
    }

    public bytes(): Array<number> {
        return this._buffer;
    }

    public clear(): void {
        this._buffer.length = 0;
    }

    public writeUnsignedVarint32(value: number) {
        while (value > 127) {
            this._buffer.push((value & 0x7f) | 0x80);
            value = value >>> 7;
        }
        this._buffer.push(value);
    };

    public writeUnsignedVarint64(value: number) {
        console.assert(value == Math.floor(value));
        console.assert((value >= 0) &&
            (value < jspb.BinaryConstants.TWO_TO_64));
        jspb.utils.splitInt64(value);
        this.writeSplitVarint64(jspb.utils.split64Low,
            jspb.utils.split64High);
    };

    /**
     * Encodes a 64-bit integer in 32:32 split representation into its wire-format
     * varint representation and stores it in the buffer.
     * @param {number} lowBits The low 32 bits of the int.
     * @param {number} highBits The high 32 bits of the int.
     */
    public writeSplitVarint64(lowBits: number, highBits: number) {
        // Break the binary representation into chunks of 7 bits, set the 8th bit
        // in each chunk if it's not the final chunk, and append to the result.
        while (highBits > 0 || lowBits > 127) {
            this._buffer.push((lowBits & 0x7f) | 0x80);
            lowBits = ((lowBits >>> 7) | (highBits << 25)) >>> 0;
            highBits = highBits >>> 7;
        }
        this._buffer.push(lowBits);
    };

    public writeInt(value: number) {
        this.writeSignedVarint32(value);
    };

    public writeLong(value: number) {
        this.writeUnsignedVarint64(value);
    };

    /**
     * Encodes a 32-bit signed integer into its wire-format varint representation
     * and stores it in the buffer.
     * @param {number} value The integer to convert.
     */
    public writeSignedVarint32(value: number) {
        // Use the unsigned version if the value is not negative.
        if (value >= 0) {
            this.writeUnsignedVarint32(value);
            return;
        }

        // Write nine bytes with a _signed_ right shift so we preserve the sign bit.
        for (var i = 0; i < 9; i++) {
            this._buffer.push((value & 0x7f) | 0x80);
            value = value >> 7;
        }

        // The above loop writes out 63 bits, so the last byte is always the sign bit
        // which is always set for negative numbers.
        this._buffer.push(1);
    };

    /**
     * Encodes a 64-bit signed integer into its wire-format varint representation
     * and stores it in the buffer. Integers that are not representable in 64 bits
     * will be truncated.
     * @param {number} value The integer to convert.
     */
    public writeSignedVarint64(value: number) {
        console.assert(value == Math.floor(value));
        console.assert((value >= -jspb.BinaryConstants.TWO_TO_63) &&
            (value < jspb.BinaryConstants.TWO_TO_63));
        jspb.utils.splitInt64(value);
        this.writeSplitVarint64(jspb.utils.split64Low, jspb.utils.split64High);
    };

    /**
     * Writes a single-precision floating point value to the buffer. Numbers
     * requiring more than 32 bits of precision will be truncated.
     * @param {number} value The value to write.
     */
    public writeFloat(value: number) {
        console.assert((value >= -jspb.BinaryConstants.FLOAT32_MAX) &&
            (value <= jspb.BinaryConstants.FLOAT32_MAX));
        jspb.utils.splitFloat32(value);
        this.writeUint32(jspb.utils.split64Low);
    };

    public writeUint32(value:number) {
        this._buffer.push((value >>> 0) & 0xFF);
        this._buffer.push((value >>> 8) & 0xFF);
        this._buffer.push((value >>> 16) & 0xFF);
        this._buffer.push((value >>> 24) & 0xFF);
    };

    /**
     * Writes a boolean value to the buffer as a varint.
     * @param {boolean} value The value to write.
     */
    public writeBool(value: boolean) {
        this._buffer.push(value ? 1 : 0);
    };

    /**
     * Writes a UTF16 Javascript string to the buffer encoded as UTF8.
     * TODO(aappleby): Add support for surrogate pairs, reject unpaired surrogates.
     * @param {string} value The string to write.
     * @return {number} The number of bytes used to encode the string.
     */
    public writeString(value: string) {
        var str_buffer = new Array<number>();

        for (var i = 0; i < value.length; i++) {

            var c = value.charCodeAt(i);

            if (c < 128) {
                str_buffer.push(c);
            } else if (c < 2048) {
                str_buffer.push((c >> 6) | 192);
                str_buffer.push((c & 63) | 128);
            } else if (c < 65536) {
                // Look for surrogates
                if (c >= 0xD800 && c <= 0xDBFF && i + 1 < value.length) {
                    var second = value.charCodeAt(i + 1);
                    if (second >= 0xDC00 && second <= 0xDFFF) { // low surrogate
                        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
                        c = (c - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;

                        str_buffer.push((c >> 18) | 240);
                        str_buffer.push(((c >> 12) & 63) | 128);
                        str_buffer.push(((c >> 6) & 63) | 128);
                        str_buffer.push((c & 63) | 128);
                        i++;
                    }
                }
                else {
                    str_buffer.push((c >> 12) | 224);
                    str_buffer.push(((c >> 6) & 63) | 128);
                    str_buffer.push((c & 63) | 128);
                }
            }
        }

        var length = str_buffer.length;
        this.writeSignedVarint32(length);
        this.writeBytes(str_buffer);
        str_buffer = null;
    };

    /**
     * Writes an arbitrary byte array to the buffer.
     * @param {!Uint8Array} bytes The array of bytes to write.
     */
    public writeBytes(bytes: any) {
        this._buffer.push.apply(this._buffer, bytes);
    };

}

export class WsDecoder {

    static _instance: WsDecoder;

    private bytes_: Uint8Array;
    private start_: number;
    private end_: number;
    private cursor_: number;
    private tempLow_: number;
    private tempHigh_: number;
    private error_: boolean;

    public constructor() {
        /**
         * Typed byte-wise view of the source buffer.
         * @private {?Uint8Array}
         */
        this.bytes_ = null;

        /**
         * Start point of the block to read.
         * @private {number}
         */
        this.start_ = 0;

        /**
         * End point of the block to read.
         * @private {number}
         */
        this.end_ = 0;

        /**
         * Current read location in bytes_.
         * @private {number}
         */
        this.cursor_ = 0;

        /**
         * Temporary storage for the low 32 bits of 64-bit data types that we're
         * decoding.
         * @private {number}
         */
        this.tempLow_ = 0;

        /**
         * Temporary storage for the high 32 bits of 64-bit data types that we're
         * decoding.
         * @private {number}
         */
        this.tempHigh_ = 0;
        this.error_ = false;
    }

    public static getInstance(): WsDecoder {
        if (!this._instance) {
            this._instance = new WsDecoder();
        }
        return this._instance;
    }

    public init(opt_bytes: Uint8Array, opt_start = null, opt_length = null): WsDecoder {
        this.bytes_ = jspb.utils.byteSourceToUint8Array(opt_bytes);
        this.start_ = opt_start | 0;
        this.end_ =
            opt_length ? this.start_ + opt_length : this.bytes_.length;
        this.cursor_ = this.start_;
        this.error_ = false;
        return this;
    }

    public free() {
        this.bytes_ = null;
        this.start_ = 0;
        this.end_ = 0;
        this.cursor_ = 0;
        this.error_ = false;
    };

    public readInt(): number {
        return this.readUnsignedVarint32();
    };

    public readString(): string {
        return this.readStringWithLength();
    };

    public readLong(): number {
        return this.readUnsignedVarint64();
    };

    public readUnsignedVarint32(): number {
        var temp;
        var bytes = this.bytes_;

        temp = bytes[this.cursor_ + 0];
        var x = (temp & 0x7F);
        if (temp < 128) {
            this.cursor_ += 1;
            return x;
        }

        temp = bytes[this.cursor_ + 1];
        x |= (temp & 0x7F) << 7;
        if (temp < 128) {
            this.cursor_ += 2;
            return x;
        }

        temp = bytes[this.cursor_ + 2];
        x |= (temp & 0x7F) << 14;
        if (temp < 128) {
            this.cursor_ += 3;
            return x;
        }

        temp = bytes[this.cursor_ + 3];
        x |= (temp & 0x7F) << 21;
        if (temp < 128) {
            this.cursor_ += 4;
            return x;
        }

        temp = bytes[this.cursor_ + 4];
        x |= (temp & 0x0F) << 28;
        if (temp < 128) {
            // We're reading the high bits of an unsigned varint. The byte we just read
            // also contains bits 33 through 35, which we're going to discard. Those
            // bits _must_ be zero, or the encoding is invalid.
            console.assert((temp & 0xF0) == 0, "readUnsignedVarint32 error!");
            this.cursor_ += 5;
            return x >>> 0;
        }

        // If we get here, we're reading the sign extension of a negative 32-bit int.
        // We can skip these bytes, as we know in advance that they have to be all
        // 1's if the varint is correctly encoded. Since we also know the value is
        // negative, we don't have to coerce it to unsigned before we return it.

        this.cursor_ += 10;
        return x;
    };

    /**
     * Reads a raw unsigned 32-bit integer from the binary stream.
     *
     * @return {number} The unsigned 32-bit integer read from the binary stream.
     */
    public readUint32(): number {
        var a = this.bytes_[this.cursor_ + 0];
        var b = this.bytes_[this.cursor_ + 1];
        var c = this.bytes_[this.cursor_ + 2];
        var d = this.bytes_[this.cursor_ + 3];
        this.cursor_ += 4;
        return ((a << 0) | (b << 8) | (c << 16) | (d << 24)) >>> 0;
    };

    /**
     * Reads a 32-bit floating-point number from the binary stream, using the
     * temporary buffer to realign the data.
     *
     * @return {number} The float read from the binary stream.
     */
    public readFloat(): number {
        var bitsLow = this.readUint32();
        var bitsHigh = 0;
        return jspb.utils.joinFloat32(bitsLow, bitsHigh);
    };

    public readBool(): boolean {
        return !!this.bytes_[this.cursor_++];
    };

    public readStringPure(length:number): string {
        var bytes = this.bytes_;
        var cursor = this.cursor_;
        var end = cursor + length;
        var codeUnits = [];

        while (cursor < end) {
            var c = bytes[cursor++];
            if (c < 128) { // Regular 7-bit ASCII.
                codeUnits.push(c);
            } else if (c < 192) {
                // UTF-8 continuation mark. We are out of sync. This
                // might happen if we attempted to read a character
                // with more than four bytes.
                continue;
            } else if (c < 224) { // UTF-8 with two bytes.
                var c2 = bytes[cursor++];
                codeUnits.push(((c & 31) << 6) | (c2 & 63));
            } else if (c < 240) { // UTF-8 with three bytes.
                var c2 = bytes[cursor++];
                var c3 = bytes[cursor++];
                codeUnits.push(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            } else if (c < 248) { // UTF-8 with 4 bytes.
                var c2 = bytes[cursor++];
                var c3 = bytes[cursor++];
                var c4 = bytes[cursor++];
                // Characters written on 4 bytes have 21 bits for a codepoint. 
                // We can't fit that on 16bit characters, so we use surrogates.
                var codepoint = ((c & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63);
                // Surrogates formula from wikipedia.
                // 1. Subtract 0x10000 from codepoint
                codepoint -= 0x10000;
                // 2. Split this into the high 10-bit value and the low 10-bit value
                // 3. Add 0xD800 to the high value to form the high surrogate
                // 4. Add 0xDC00 to the low value to form the low surrogate:
                var low = (codepoint & 1023) + 0xDC00;
                var high = ((codepoint >> 10) & 1023) + 0xD800;
                codeUnits.push(high, low);
            }
        }
        // String.fromCharCode.apply is faster than manually appending characters on
        // Chrome 25+, and generates no additional cons string garbage.
        var result = String.fromCharCode.apply(null, codeUnits);
        this.cursor_ = cursor;
        return result;
    };


    /**
     * Reads and parses a UTF-8 encoded unicode string (with length prefix) from
     * the stream.
     * @return {string} The decoded string.
     */
    public readStringWithLength(): string {
        var length = this.readUnsignedVarint32();
        return this.readStringPure(length);
    };

    public readUnsignedVarint64(): number {
        this.readSplitVarint64_();
        return jspb.utils.joinUint64(this.tempLow_, this.tempHigh_);
    };

    /**
     * Reads an unsigned varint from the binary stream and stores it as a split
     * 64-bit integer. Since this does not convert the value to a number, no
     * precision is lost.
     *
     * It's possible for an unsigned varint to be incorrectly encoded - more than
     * 64 bits' worth of data could be present. If this happens, this method will
     * throw an error.
     *
     * Decoding varints requires doing some funny base-128 math - for more
     * details on the format, see
     * https://developers.google.com/protocol-buffers/docs/encoding
     *
     * @private
     */
    public readSplitVarint64_(): void {
        var temp;
        var lowBits = 0;
        var highBits = 0;

        // Read the first four bytes of the varint, stopping at the terminator if we
        // see it.
        for (var i = 0; i < 4; i++) {
            temp = this.bytes_[this.cursor_++];
            lowBits |= (temp & 0x7F) << (i * 7);
            if (temp < 128) {
                this.tempLow_ = lowBits >>> 0;
                this.tempHigh_ = 0;
                return;
            }
        }

        // Read the fifth byte, which straddles the low and high dwords.
        temp = this.bytes_[this.cursor_++];
        lowBits |= (temp & 0x7F) << 28;
        highBits |= (temp & 0x7F) >> 4;
        if (temp < 128) {
            this.tempLow_ = lowBits >>> 0;
            this.tempHigh_ = highBits >>> 0;
            return;
        }

        // Read the sixth through tenth byte.
        for (var i = 0; i < 5; i++) {
            temp = this.bytes_[this.cursor_++];
            highBits |= (temp & 0x7F) << (i * 7 + 3);
            if (temp < 128) {
                this.tempLow_ = lowBits >>> 0;
                this.tempHigh_ = highBits >>> 0;
                return;
            }
        }

        // If we did not see the terminator, the encoding was invalid.
        cc.error('Failed to read varint, encoding is invalid.');
        this.error_ = true;
    };
}