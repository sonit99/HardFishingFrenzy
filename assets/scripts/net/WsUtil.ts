export module jspb {
	export class BinaryConstants {

		static FieldType = {
			INVALID: -1,
			DOUBLE: 1,
			FLOAT: 2,
			INT64: 3,
			UINT64: 4,
			INT32: 5,
			FIXED64: 6,
			FIXED32: 7,
			BOOL: 8,
			STRING: 9,
			GROUP: 10,
			MESSAGE: 11,
			BYTES: 12,
			UINT32: 13,
			ENUM: 14,
			SFIXED32: 15,
			SFIXED64: 16,
			SINT32: 17,
			SINT64: 18,

			// Extended types for Javascript

			FHASH64: 30, // 64-bit hash string, fixed-length encoding.
			VHASH64: 31  // 64-bit hash string, varint encoding.
		};

		static WireType = {
			INVALID: -1,
			VARINT: 0,
			FIXED64: 1,
			DELIMITED: 2,
			START_GROUP: 3,
			END_GROUP: 4,
			FIXED32: 5
		};

		
		/**
		 * Flag to indicate a missing field.
		 * @const {number}
		 */
		static INVALID_FIELD_NUMBER = -1;


		/**
		 * The smallest denormal float32 value.
		 * @const {number}
		 */
		static FLOAT32_EPS = 1.401298464324817e-45;


		/**
		 * The smallest normal float64 value.
		 * @const {number}
		 */
		static FLOAT32_MIN = 1.1754943508222875e-38;


		/**
		 * The largest finite float32 value.
		 * @const {number}
		 */
		static FLOAT32_MAX = 3.4028234663852886e+38;


		/**
		 * The smallest denormal float64 value.
		 * @const {number}
		 */
		static FLOAT64_EPS = 5e-324;


		/**
		 * The smallest normal float64 value.
		 * @const {number}
		 */
		static FLOAT64_MIN = 2.2250738585072014e-308;


		/**
		 * The largest finite float64 value.
		 * @const {number}
		 */
		static FLOAT64_MAX = 1.7976931348623157e+308;


		/**
		 * Convenience constant equal to 2^20.
		 * @const {number}
		 */
		static TWO_TO_20 = 1048576;


		/**
		 * Convenience constant equal to 2^23.
		 * @const {number}
		 */
		static TWO_TO_23 = 8388608;


		/**
		 * Convenience constant equal to 2^31.
		 * @const {number}
		 */
		static TWO_TO_31 = 2147483648;


		/**
		 * Convenience constant equal to 2^32.
		 * @const {number}
		 */
		static TWO_TO_32 = 4294967296;


		/**
		 * Convenience constant equal to 2^52.
		 * @const {number}
		 */
		static TWO_TO_52 = 4503599627370496;


		/**
		 * Convenience constant equal to 2^63.
		 * @const {number}
		 */
		static TWO_TO_63 = 9223372036854775808;


		/**
		 * Convenience constant equal to 2^64.
		 * @const {number}
		 */
		static TWO_TO_64 = 18446744073709551616;


		/**
		 * Eight-character string of zeros, used as the default 64-bit hash value.
		 * @const {string}
		 */
		static ZERO_HASH = '\0\0\0\0\0\0\0\0';


		static FieldTypeToWireType(fieldType:number):number{
			var fieldTypes = jspb.BinaryConstants.FieldType;
			var wireTypes = jspb.BinaryConstants.WireType;
			switch (fieldType) {
				case fieldTypes.INT32:
				case fieldTypes.INT64:
				case fieldTypes.UINT32:
				case fieldTypes.UINT64:
				case fieldTypes.SINT32:
				case fieldTypes.SINT64:
				case fieldTypes.BOOL:
				case fieldTypes.ENUM:
				case fieldTypes.VHASH64:
				return wireTypes.VARINT;

				case fieldTypes.DOUBLE:
				case fieldTypes.FIXED64:
				case fieldTypes.SFIXED64:
				case fieldTypes.FHASH64:
				return wireTypes.FIXED64;

				case fieldTypes.STRING:
				case fieldTypes.MESSAGE:
				case fieldTypes.BYTES:
				return wireTypes.DELIMITED;

				case fieldTypes.FLOAT:
				case fieldTypes.FIXED32:
				case fieldTypes.SFIXED32:
				return wireTypes.FIXED32;

				case fieldTypes.INVALID:
				case fieldTypes.GROUP:
				default:
				return wireTypes.INVALID;
			}
		}

	}

	export class utils{
		/**
		 * Javascript can't natively handle 64-bit data types, so to manipulate them we
		 * have to split them into two 32-bit halves and do the math manually.
		 *
		 * Instead of instantiating and passing small structures around to do this, we
		 * instead just use two global temporary values. This one stores the low 32
		 * bits of a split value - for example, if the original value was a 64-bit
		 * integer, this temporary value will contain the low 32 bits of that integer.
		 * If the original value was a double, this temporary value will contain the
		 * low 32 bits of the binary representation of that double, etcetera.
		 * @type {number}
		 */
		static split64Low = 0;


		/**
		 * And correspondingly, this temporary variable will contain the high 32 bits
		 * of whatever value was split.
		 * @type {number}
		 */
		static split64High = 0;

		
		/**
		 * Splits an unsigned Javascript integer into two 32-bit halves and stores it
		 * in the temp values above.
		 * @param {number} value The number to split.
		 */
		static splitUint64(value:number) {
		// Extract low 32 bits and high 32 bits as unsigned integers.
		var lowBits = value >>> 0;
		var highBits = Math.floor((value - lowBits) /
									jspb.BinaryConstants.TWO_TO_32) >>> 0;

		jspb.utils.split64Low = lowBits;
		jspb.utils.split64High = highBits;
		};


		/**
		 * Splits a signed Javascript integer into two 32-bit halves and stores it in
		 * the temp values above.
		 * @param {number} value The number to split.
		 */
		static splitInt64(value:number) {
		// Convert to sign-magnitude representation.
		var sign = (value < 0);
		value = Math.abs(value);

		// Extract low 32 bits and high 32 bits as unsigned integers.
		var lowBits = value >>> 0;
		var highBits = Math.floor((value - lowBits) /
									jspb.BinaryConstants.TWO_TO_32);
		highBits = highBits >>> 0;

		// Perform two's complement conversion if the sign bit was set.
		if (sign) {
			highBits = ~highBits >>> 0;
			lowBits = ~lowBits >>> 0;
			lowBits += 1;
			if (lowBits > 0xFFFFFFFF) {
			lowBits = 0;
			highBits++;
			if (highBits > 0xFFFFFFFF) highBits = 0;
			}
		}

		jspb.utils.split64Low = lowBits;
		jspb.utils.split64High = highBits;
		};


		/**
		 * Convers a signed Javascript integer into zigzag format, splits it into two
		 * 32-bit halves, and stores it in the temp values above.
		 * @param {number} value The number to split.
		 */
		static splitZigzag64(value:number) {
		// Convert to sign-magnitude and scale by 2 before we split the value.
		var sign = (value < 0);
		value = Math.abs(value) * 2;

		jspb.utils.splitUint64(value);
		var lowBits = jspb.utils.split64Low;
		var highBits = jspb.utils.split64High;

		// If the value is negative, subtract 1 from the split representation so we
		// don't lose the sign bit due to precision issues.
		if (sign) {
			if (lowBits == 0) {
			if (highBits == 0) {
				lowBits = 0xFFFFFFFF;
				highBits = 0xFFFFFFFF;
			} else {
				highBits--;
				lowBits = 0xFFFFFFFF;
			}
			} else {
			lowBits--;
			}
		}

		jspb.utils.split64Low = lowBits;
		jspb.utils.split64High = highBits;
		};


		/**
		 * Converts a floating-point number into 32-bit IEEE representation and stores
		 * it in the temp values above.
		 * @param {number} value
		 */
		static splitFloat32(value:number) {
		var sign = (value < 0) ? 1 : 0;
		value = sign ? -value : value;
		var exp;
		var mant;

		// Handle zeros.
		if (value === 0) {
			if ((1 / value) > 0) {
			// Positive zero.
			jspb.utils.split64High = 0;
			jspb.utils.split64Low = 0x00000000;
			} else {
			// Negative zero.
			jspb.utils.split64High = 0;
			jspb.utils.split64Low = 0x80000000;
			}
			return;
		}

		// Handle nans.
		if (isNaN(value)) {
			jspb.utils.split64High = 0;
			jspb.utils.split64Low = 0x7FFFFFFF;
			return;
		}

		// Handle infinities.
		if (value > jspb.BinaryConstants.FLOAT32_MAX) {
			jspb.utils.split64High = 0;
			jspb.utils.split64Low = ((sign << 31) | (0x7F800000)) >>> 0;
			return;
		}

		// Handle denormals.
		if (value < jspb.BinaryConstants.FLOAT32_MIN) {
			// Number is a denormal.
			mant = Math.round(value / Math.pow(2, -149));
			jspb.utils.split64High = 0;
			jspb.utils.split64Low = ((sign << 31) | mant) >>> 0;
			return;
		}

		exp = Math.floor(Math.log(value) / Math.LN2);
		mant = value * Math.pow(2, -exp);
		mant = Math.round(mant * jspb.BinaryConstants.TWO_TO_23) & 0x7FFFFF;

		jspb.utils.split64High = 0;
		jspb.utils.split64Low = ((sign << 31) | ((exp + 127) << 23) | mant) >>> 0;
		};


		/**
		 * Converts a floating-point number into 64-bit IEEE representation and stores
		 * it in the temp values above.
		 * @param {number} value
		 */
		static splitFloat64(value:number) {
		var sign = (value < 0) ? 1 : 0;
		value = sign ? -value : value;

		// Handle zeros.
		if (value === 0) {
			if ((1 / value) > 0) {
			// Positive zero.
			jspb.utils.split64High = 0x00000000;
			jspb.utils.split64Low = 0x00000000;
			} else {
			// Negative zero.
			jspb.utils.split64High = 0x80000000;
			jspb.utils.split64Low = 0x00000000;
			}
			return;
		}

		// Handle nans.
		if (isNaN(value)) {
			jspb.utils.split64High = 0x7FFFFFFF;
			jspb.utils.split64Low = 0xFFFFFFFF;
			return;
		}

		// Handle infinities.
		if (value > jspb.BinaryConstants.FLOAT64_MAX) {
			jspb.utils.split64High = ((sign << 31) | (0x7FF00000)) >>> 0;
			jspb.utils.split64Low = 0;
			return;
		}

		// Handle denormals.
		if (value < jspb.BinaryConstants.FLOAT64_MIN) {
			// Number is a denormal.
			var mant = value / Math.pow(2, -1074);
			var mantHigh = (mant / jspb.BinaryConstants.TWO_TO_32);
			jspb.utils.split64High = ((sign << 31) | mantHigh) >>> 0;
			jspb.utils.split64Low = (mant >>> 0);
			return;
		}

		var exp = Math.floor(Math.log(value) / Math.LN2);
		if (exp == 1024) exp = 1023;
		var mant = value * Math.pow(2, -exp);

		var mantHigh = (mant * jspb.BinaryConstants.TWO_TO_20) & 0xFFFFF;
		var mantLow = (mant * jspb.BinaryConstants.TWO_TO_52) >>> 0;

		jspb.utils.split64High =
			((sign << 31) | ((exp + 1023) << 20) | mantHigh) >>> 0;
		jspb.utils.split64Low = mantLow;
		};


		/**
		 * Converts an 8-character hash string into two 32-bit numbers and stores them
		 * in the temp values above.
		 * @param {string} hash
		 */
		static splitHash64(hash:string) {
		var a = hash.charCodeAt(0);
		var b = hash.charCodeAt(1);
		var c = hash.charCodeAt(2);
		var d = hash.charCodeAt(3);
		var e = hash.charCodeAt(4);
		var f = hash.charCodeAt(5);
		var g = hash.charCodeAt(6);
		var h = hash.charCodeAt(7);

		jspb.utils.split64Low = (a + (b << 8) + (c << 16) + (d << 24)) >>> 0;
		jspb.utils.split64High = (e + (f << 8) + (g << 16) + (h << 24)) >>> 0;
		};


		/**
		 * Joins two 32-bit values into a 64-bit unsigned integer. Precision will be
		 * lost if the result is greater than 2^52.
		 * @param {number} bitsLow
		 * @param {number} bitsHigh
		 * @return {number}
		 */
		static joinUint64(bitsLow:number, bitsHigh:number):number {
		return bitsHigh * jspb.BinaryConstants.TWO_TO_32 + bitsLow;
		};


		/**
		 * Joins two 32-bit values into a 64-bit signed integer. Precision will be lost
		 * if the result is greater than 2^52.
		 * @param {number} bitsLow
		 * @param {number} bitsHigh
		 * @return {number}
		 */
		static joinInt64(bitsLow:number, bitsHigh:number):number {
		// If the high bit is set, do a manual two's complement conversion.
		var sign = (bitsHigh & 0x80000000);
		if (sign) {
			bitsLow = (~bitsLow + 1) >>> 0;
			bitsHigh = ~bitsHigh >>> 0;
			if (bitsLow == 0) {
			bitsHigh = (bitsHigh + 1) >>> 0;
			}
		}

		var result = jspb.utils.joinUint64(bitsLow, bitsHigh);
		return sign ? -result : result;
		};


		/**
		 * Joins two 32-bit values into a 64-bit unsigned integer and applies zigzag
		 * decoding. Precision will be lost if the result is greater than 2^52.
		 * @param {number} bitsLow
		 * @param {number} bitsHigh
		 * @return {number}
		 */
		static joinZigzag64(bitsLow:number, bitsHigh:number):number {
		// Extract the sign bit and shift right by one.
		var sign = bitsLow & 1;
		bitsLow = ((bitsLow >>> 1) | (bitsHigh << 31)) >>> 0;
		bitsHigh = bitsHigh >>> 1;

		// Increment the split value if the sign bit was set.
		if (sign) {
			bitsLow = (bitsLow + 1) >>> 0;
			if (bitsLow == 0) {
			bitsHigh = (bitsHigh + 1) >>> 0;
			}
		}

		var result = jspb.utils.joinUint64(bitsLow, bitsHigh);
		return sign ? -result : result;
		};


		/**
		 * Joins two 32-bit values into a 32-bit IEEE floating point number and
		 * converts it back into a Javascript number.
		 * @param {number} bitsLow The low 32 bits of the binary number;
		 * @param {number} bitsHigh The high 32 bits of the binary number.
		 * @return {number}
		 */
		static joinFloat32(bitsLow:number, bitsHigh:number):number {
		var sign = ((bitsLow >> 31) * 2 + 1);
		var exp = (bitsLow >>> 23) & 0xFF;
		var mant = bitsLow & 0x7FFFFF;

		if (exp == 0xFF) {
			if (mant) {
			return NaN;
			} else {
			return sign * Infinity;
			}
		}

		if (exp == 0) {
			// Denormal.
			return sign * Math.pow(2, -149) * mant;
		} else {
			return sign * Math.pow(2, exp - 150) *
				(mant + Math.pow(2, 23));
		}
		};


		/**
		 * Joins two 32-bit values into a 64-bit IEEE floating point number and
		 * converts it back into a Javascript number.
		 * @param {number} bitsLow The low 32 bits of the binary number;
		 * @param {number} bitsHigh The high 32 bits of the binary number.
		 * @return {number}
		 */
		static joinFloat64(bitsLow:number, bitsHigh:number):number {
		var sign = ((bitsHigh >> 31) * 2 + 1);
		var exp = (bitsHigh >>> 20) & 0x7FF;
		var mant = jspb.BinaryConstants.TWO_TO_32 * (bitsHigh & 0xFFFFF) + bitsLow;

		if (exp == 0x7FF) {
			if (mant) {
			return NaN;
			} else {
			return sign * Infinity;
			}
		}

		if (exp == 0) {
			// Denormal.
			return sign * Math.pow(2, -1074) * mant;
		} else {
			return sign * Math.pow(2, exp - 1075) *
				(mant + jspb.BinaryConstants.TWO_TO_52);
		}
		};


		/**
		 * Joins two 32-bit values into an 8-character hash string.
		 * @param {number} bitsLow
		 * @param {number} bitsHigh
		 * @return {string}
		 */
		static joinHash64(bitsLow:number, bitsHigh:number):string {
		var a = (bitsLow >>> 0) & 0xFF;
		var b = (bitsLow >>> 8) & 0xFF;
		var c = (bitsLow >>> 16) & 0xFF;
		var d = (bitsLow >>> 24) & 0xFF;
		var e = (bitsHigh >>> 0) & 0xFF;
		var f = (bitsHigh >>> 8) & 0xFF;
		var g = (bitsHigh >>> 16) & 0xFF;
		var h = (bitsHigh >>> 24) & 0xFF;

		return String.fromCharCode(a, b, c, d, e, f, g, h);
		};


		/**
		 * Individual digits for number->string conversion.
		 * @const {!Array.<number>}
		 */
		static DIGITS = [
		'0', '1', '2', '3', '4', '5', '6', '7',
		'8', '9', 'a', 'b', 'c', 'd', 'e', 'f'
		];


		/**
		 * Losslessly converts a 64-bit unsigned integer in 32:32 split representation
		 * into a decimal string.
		 * @param {number} bitsLow The low 32 bits of the binary number;
		 * @param {number} bitsHigh The high 32 bits of the binary number.
		 * @return {string} The binary number represented as a string.
		 */
		static joinUnsignedDecimalString(bitsLow:number, bitsHigh:number):string {
		// Skip the expensive conversion if the number is small enough to use the
		// built-in conversions.
		if (bitsHigh <= 0x1FFFFF) {
			return '' + (jspb.BinaryConstants.TWO_TO_32 * bitsHigh + bitsLow);
		}

		// What this code is doing is essentially converting the input number from
		// base-2 to base-1e7, which allows us to represent the 64-bit range with
		// only 3 (very large) digits. Those digits are then trivial to convert to
		// a base-10 string.

		// The magic numbers used here are -
		// 2^24 = 16777216 = (1,6777216) in base-1e7.
		// 2^48 = 281474976710656 = (2,8147497,6710656) in base-1e7.

		// Split 32:32 representation into 16:24:24 representation so our
		// intermediate digits don't overflow.
		var low = bitsLow & 0xFFFFFF;
		var mid = (((bitsLow >>> 24) | (bitsHigh << 8)) >>> 0) & 0xFFFFFF;
		var high = (bitsHigh >> 16) & 0xFFFF;

		// Assemble our three base-1e7 digits, ignoring carries. The maximum
		// value in a digit at this step is representable as a 48-bit integer, which
		// can be stored in a 64-bit floating point number.
		var digitA = low + (mid * 6777216) + (high * 6710656);
		var digitB = mid + (high * 8147497);
		var digitC = (high * 2);

		// Apply carries from A to B and from B to C.
		var base = 10000000;
		if (digitA >= base) {
			digitB += Math.floor(digitA / base);
			digitA %= base;
		}

		if (digitB >= base) {
			digitC += Math.floor(digitB / base);
			digitB %= base;
		}

		// Convert base-1e7 digits to base-10, omitting leading zeroes.
		var table = jspb.utils.DIGITS;
		var start = false;
		var result = '';

		function emit(digit) {
			var temp = base;
			for (var i = 0; i < 7; i++) {
			temp /= 10;
			var decimalDigit = ((digit / temp) % 10) >>> 0;
			if ((decimalDigit == 0) && !start) continue;
			start = true;
			result += table[decimalDigit];
			}
		}

		if (digitC || start) emit(digitC);
		if (digitB || start) emit(digitB);
		if (digitA || start) emit(digitA);

		return result;
		};


		/**
		 * Losslessly converts a 64-bit signed integer in 32:32 split representation
		 * into a decimal string.
		 * @param {number} bitsLow The low 32 bits of the binary number;
		 * @param {number} bitsHigh The high 32 bits of the binary number.
		 * @return {string} The binary number represented as a string.
		 */
		static joinSignedDecimalString(bitsLow:number, bitsHigh:number):string {
		// If we're treating the input as a signed value and the high bit is set, do
		// a manual two's complement conversion before the decimal conversion.
		var negative = (bitsHigh & 0x80000000);
		if (negative) {
			bitsLow = (~bitsLow + 1) >>> 0;
			var carry = (bitsLow == 0) ? 1 : 0;
			bitsHigh = (~bitsHigh + carry) >>> 0;
		}

		var result = jspb.utils.joinUnsignedDecimalString(bitsLow, bitsHigh);
		return negative ? '-' + result : result;
		};


		/**
		 * Convert an 8-character hash string representing either a signed or unsigned
		 * 64-bit integer into its decimal representation without losing accuracy.
		 * @param {string} hash The hash string to convert.
		 * @param {boolean} signed True if we should treat the hash string as encoding
		 *     a signed integer.
		 * @return {string}
		 */
		static hash64ToDecimalString(hash:string, signed:boolean):string {
		jspb.utils.splitHash64(hash);
		var bitsLow = jspb.utils.split64Low;
		var bitsHigh = jspb.utils.split64High;
		return signed ?
			jspb.utils.joinSignedDecimalString(bitsLow, bitsHigh) :
			jspb.utils.joinUnsignedDecimalString(bitsLow, bitsHigh);
		};


		/**
		 * Converts an array of 8-character hash strings into their decimal
		 * representations.
		 * @param {!Array.<string>} hashes The array of hash strings to convert.
		 * @param {boolean} signed True if we should treat the hash string as encoding
		 *     a signed integer.
		 * @return {!Array.<string>}
		 */
		static hash64ArrayToDecimalStrings(hashes:Array<string>, signed:boolean):Array<string> {
		var result = new Array(hashes.length);
		for (var i = 0; i < hashes.length; i++) {
			result[i] = jspb.utils.hash64ToDecimalString(hashes[i], signed);
		}
		return result;
		};


		/**
		 * Converts a signed or unsigned decimal string into its hash string
		 * representation.
		 * @param {string} dec
		 * @return {string}
		 */
		static decimalStringToHash64(dec:string):string {
		console.assert(dec.length > 0);

		// Check for minus sign.
		var minus = false;
		if (dec[0] === '-') {
			minus = true;
			dec = dec.slice(1);
		}

		// Store result as a byte array.
		var resultBytes = [0, 0, 0, 0, 0, 0, 0, 0];

		// Set result to m*result + c.
		function muladd(m, c) {
			for (var i = 0; i < 8 && (m !== 1 || c > 0); i++) {
			var r = m * resultBytes[i] + c;
			resultBytes[i] = r & 0xFF;
			c = r >>> 8;
			}
		}

		// Negate the result bits.
		function neg() {
			for (var i = 0; i < 8; i++) {
			resultBytes[i] = (~resultBytes[i]) & 0xFF;
			}
		}

		// For each decimal digit, set result to 10*result + digit.
		for (var i = 0; i < dec.length; i++) {
			muladd(10, jspb.utils.DIGITS.indexOf(dec[i]));
		}

		// If there's a minus sign, convert into two's complement.
		if (minus) {
			neg();
			muladd(1, 1);
		}

		return String.fromCharCode.apply(null, resultBytes);
		};


		/**
		 * Converts a signed or unsigned decimal string into two 32-bit halves, and
		 * stores them in the temp variables listed above.
		 * @param {string} value The decimal string to convert.
		 */
		static splitDecimalString(value:string) {
		jspb.utils.splitHash64(jspb.utils.decimalStringToHash64(value));
		};


		/**
		 * Converts an 8-character hash string into its hexadecimal representation.
		 * @param {string} hash
		 * @return {string}
		 */
		static hash64ToHexString(hash:string):string {
		var temp = new Array(18);
		temp[0] = '0';
		temp[1] = 'x';

		for (var i = 0; i < 8; i++) {
			var c = hash.charCodeAt(7 - i);
			temp[i * 2 + 2] = jspb.utils.DIGITS[c >> 4];
			temp[i * 2 + 3] = jspb.utils.DIGITS[c & 0xF];
		}

		var result = temp.join('');
		return result;
		};


		/**
		 * Converts a '0x<16 digits>' hex string into its hash string representation.
		 * @param {string} hex
		 * @return {string}
		 */
		static hexStringToHash64(hex:string):string {
		hex = hex.toLowerCase();
		console.assert(hex.length == 18);
		console.assert(hex[0] == '0');
		console.assert(hex[1] == 'x');

		var result = '';
		for (var i = 0; i < 8; i++) {
			var hi = jspb.utils.DIGITS.indexOf(hex[i * 2 + 2]);
			var lo = jspb.utils.DIGITS.indexOf(hex[i * 2 + 3]);
			result = String.fromCharCode(hi * 16 + lo) + result;
		}

		return result;
		};


		/**
		 * Convert an 8-character hash string representing either a signed or unsigned
		 * 64-bit integer into a Javascript number. Will lose accuracy if the result is
		 * larger than 2^52.
		 * @param {string} hash The hash string to convert.
		 * @param {boolean} signed True if the has should be interpreted as a signed
		 *     number.
		 * @return {number}
		 */
		static hash64ToNumber(hash:string, signed:boolean):number {
		jspb.utils.splitHash64(hash);
		var bitsLow = jspb.utils.split64Low;
		var bitsHigh = jspb.utils.split64High;
		return signed ? jspb.utils.joinInt64(bitsLow, bitsHigh) :
						jspb.utils.joinUint64(bitsLow, bitsHigh);
		};


		/**
		 * Convert a Javascript number into an 8-character hash string. Will lose
		 * precision if the value is non-integral or greater than 2^64.
		 * @param {number} value The integer to convert.
		 * @return {string}
		 */
		static numberToHash64(value:number):string {
		jspb.utils.splitInt64(value);
		return jspb.utils.joinHash64(jspb.utils.split64Low,
										jspb.utils.split64High);
		};


		/**
		 * Counts the number of contiguous varints in a buffer.
		 * @param {!Uint8Array} buffer The buffer to scan.
		 * @param {number} start The starting point in the buffer to scan.
		 * @param {number} end The end point in the buffer to scan.
		 * @return {number} The number of varints in the buffer.
		 */
		static countVarints(buffer:Uint8Array, start:number, end:number):number {
		// Count how many high bits of each byte were set in the buffer.
		var count = 0;
		for (var i = start; i < end; i++) {
			count += buffer[i] >> 7;
		}

		// The number of varints in the buffer equals the size of the buffer minus
		// the number of non-terminal bytes in the buffer (those with the high bit
		// set).
		return (end - start) - count;
		};


		/**
		 * Counts the number of contiguous varint fields with the given field number in
		 * the buffer.
		 * @param {!Uint8Array} buffer The buffer to scan.
		 * @param {number} start The starting point in the buffer to scan.
		 * @param {number} end The end point in the buffer to scan.
		 * @param {number} field The field number to count.
		 * @return {number} The number of matching fields in the buffer.
		 */
		static countVarintFields(buffer:Uint8Array, start:number, end:number, field:number):number {
		var count = 0;
		var cursor = start;
		var tag = field * 8 + jspb.BinaryConstants.WireType.VARINT;

		if (tag < 128) {
			// Single-byte field tag, we can use a slightly quicker count.
			while (cursor < end) {
			// Skip the field tag, or exit if we find a non-matching tag.
			if (buffer[cursor++] != tag) return count;

			// Field tag matches, we've found a valid field.
			count++;

			// Skip the varint.
			while (1) {
				var x = buffer[cursor++];
				if ((x & 0x80) == 0) break;
			}
			}
		} else {
			while (cursor < end) {
			// Skip the field tag, or exit if we find a non-matching tag.
			var temp = tag;
			while (temp > 128) {
				if (buffer[cursor] != ((temp & 0x7F) | 0x80)) return count;
				cursor++;
				temp >>= 7;
			}
			if (buffer[cursor++] != temp) return count;

			// Field tag matches, we've found a valid field.
			count++;

			// Skip the varint.
			while (1) {
				var x = buffer[cursor++];
				if ((x & 0x80) == 0) break;
			}
			}
		}
		return count;
		};


		/**
		 * Counts the number of contiguous fixed32 fields with the given tag in the
		 * buffer.
		 * @param {!Uint8Array} buffer The buffer to scan.
		 * @param {number} start The starting point in the buffer to scan.
		 * @param {number} end The end point in the buffer to scan.
		 * @param {number} tag The tag value to count.
		 * @param {number} stride The number of bytes to skip per field.
		 * @return {number} The number of fields with a matching tag in the buffer.
		 * @private
		 */
		static countFixedFields_(buffer:Uint8Array, start:number, end:number, tag:number, stride:number):number {
		var count = 0;
		var cursor = start;

		if (tag < 128) {
			// Single-byte field tag, we can use a slightly quicker count.
			while (cursor < end) {
			// Skip the field tag, or exit if we find a non-matching tag.
			if (buffer[cursor++] != tag) return count;

			// Field tag matches, we've found a valid field.
			count++;

			// Skip the value.
			cursor += stride;
			}
		} else {
			while (cursor < end) {
			// Skip the field tag, or exit if we find a non-matching tag.
			var temp = tag;
			while (temp > 128) {
				if (buffer[cursor++] != ((temp & 0x7F) | 0x80)) return count;
				temp >>= 7;
			}
			if (buffer[cursor++] != temp) return count;

			// Field tag matches, we've found a valid field.
			count++;

			// Skip the value.
			cursor += stride;
			}
		}
		return count;
		};


		/**
		 * Counts the number of contiguous fixed32 fields with the given field number
		 * in the buffer.
		 * @param {!Uint8Array} buffer The buffer to scan.
		 * @param {number} start The starting point in the buffer to scan.
		 * @param {number} end The end point in the buffer to scan.
		 * @param {number} field The field number to count.
		 * @return {number} The number of matching fields in the buffer.
		 */
		static countFixed32Fields(buffer:Uint8Array, start:number, end:number, field:number):number {
		var tag = field * 8 + jspb.BinaryConstants.WireType.FIXED32;
		return jspb.utils.countFixedFields_(buffer, start, end, tag, 4);
		};


		/**
		 * Counts the number of contiguous fixed64 fields with the given field number
		 * in the buffer.
		 * @param {!Uint8Array} buffer The buffer to scan.
		 * @param {number} start The starting point in the buffer to scan.
		 * @param {number} end The end point in the buffer to scan.
		 * @param {number} field The field number to count
		 * @return {number} The number of matching fields in the buffer.
		 */
		static countFixed64Fields(buffer:Uint8Array, start:number, end:number, field:number):number {
		var tag = field * 8 + jspb.BinaryConstants.WireType.FIXED64;
		return jspb.utils.countFixedFields_(buffer, start, end, tag, 8);
		};


		/**
		 * Counts the number of contiguous delimited fields with the given field number
		 * in the buffer.
		 * @param {!Uint8Array} buffer The buffer to scan.
		 * @param {number} start The starting point in the buffer to scan.
		 * @param {number} end The end point in the buffer to scan.
		 * @param {number} field The field number to count.
		 * @return {number} The number of matching fields in the buffer.
		 */
		static countDelimitedFields(buffer:Uint8Array, start:number, end:number, field:number):number {
		var count = 0;
		var cursor = start;
		var tag = field * 8 + jspb.BinaryConstants.WireType.DELIMITED;

		while (cursor < end) {
			// Skip the field tag, or exit if we find a non-matching tag.
			var temp = tag;
			while (temp > 128) {
			if (buffer[cursor++] != ((temp & 0x7F) | 0x80)) return count;
			temp >>= 7;
			}
			if (buffer[cursor++] != temp) return count;

			// Field tag matches, we've found a valid field.
			count++;

			// Decode the length prefix.
			var length = 0;
			var shift = 1;
			while (1) {
			temp = buffer[cursor++];
			length += (temp & 0x7f) * shift;
			shift *= 128;
			if ((temp & 0x80) == 0) break;
			}

			// Advance the cursor past the blob.
			cursor += length;
		}
		return count;
		};


		/**
		 * Utility function: convert a string with codepoints 0--255 inclusive to a
		 * Uint8Array. If any codepoints greater than 255 exist in the string, throws an
		 * exception.
		 * @param {string} str
		 * @return {!Uint8Array}
		 */
		static stringToByteArray(str:string):Uint8Array {
		var arr = new Uint8Array(str.length);
		for (var i = 0; i < str.length; i++) {
			var codepoint = str.charCodeAt(i);
			if (codepoint > 255) {
			throw new Error('Conversion error: string contains codepoint ' +
							'outside of byte range');
			}
			arr[i] = codepoint;
		}
		return arr;
		};

		static byteSourceToUint8Array(data:any) {
			if (data.constructor === Uint8Array) {
				return /** @type {!Uint8Array} */(data);
			}

			if (data.constructor === ArrayBuffer) {
				data = /** @type {!ArrayBuffer} */(data);
				return /** @type {!Uint8Array} */(new Uint8Array(data));
			}

			if (data.constructor === Array) {
				data = /** @type {!Array.<number>} */(data);
				return /** @type {!Uint8Array} */(new Uint8Array(data));
			}

			// if (data.constructor === String) {
			// 	data = /** @type {string} */(data);
			// 	return goog.crypt.base64.decodeStringToUint8Array(data);
			// }

			console.assert(false,'Type not convertible to Uint8Array.');
			return /** @type {!Uint8Array} */(new Uint8Array(0));
		};

	}

}