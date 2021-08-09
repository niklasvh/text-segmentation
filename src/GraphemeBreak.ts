import {base64, byteLength} from './grapheme-break-trie';
import {createTrieFromBase64} from 'utrie';

const Other = 0;
const Prepend = 1;
const CR = 2;
const LF = 3;
const Control = 4;
const Extend = 5;
const Regional_Indicator = 6;
const SpacingMark = 7;
const L = 8;
const V = 9;
const T = 10;
const LV = 11;
const LVT = 12;
const ZWJ = 13;
const Extended_Pictographic = 14;
const RI = 15;

export const classes: {[key: string]: number} = {
    Other,
    Prepend,
    CR,
    LF,
    Control,
    Extend,
    Regional_Indicator,
    SpacingMark,
    L,
    V,
    T,
    LV,
    LVT,
    ZWJ,
    Extended_Pictographic,
    RI,
};

export const toCodePoints = (str: string): number[] => {
    const codePoints = [];
    let i = 0;
    const length = str.length;
    while (i < length) {
        const value = str.charCodeAt(i++);
        if (value >= 0xd800 && value <= 0xdbff && i < length) {
            const extra = str.charCodeAt(i++);
            if ((extra & 0xfc00) === 0xdc00) {
                codePoints.push(((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000);
            } else {
                codePoints.push(value);
                i--;
            }
        } else {
            codePoints.push(value);
        }
    }
    return codePoints;
};

export const fromCodePoint = (...codePoints: number[]): string => {
    if (String.fromCodePoint) {
        return String.fromCodePoint(...codePoints);
    }

    const length = codePoints.length;
    if (!length) {
        return '';
    }

    const codeUnits = [];

    let index = -1;
    let result = '';
    while (++index < length) {
        let codePoint = codePoints[index];
        if (codePoint <= 0xffff) {
            codeUnits.push(codePoint);
        } else {
            codePoint -= 0x10000;
            codeUnits.push((codePoint >> 10) + 0xd800, (codePoint % 0x400) + 0xdc00);
        }
        if (index + 1 === length || codeUnits.length > 0x4000) {
            result += String.fromCharCode(...codeUnits);
            codeUnits.length = 0;
        }
    }
    return result;
};

export const UnicodeTrie = createTrieFromBase64(base64, byteLength);

export const BREAK_NOT_ALLOWED = '×';
export const BREAK_ALLOWED = '÷';

export type BREAK_OPPORTUNITIES = typeof BREAK_NOT_ALLOWED | typeof BREAK_ALLOWED;

export const codePointToClass = (codePoint: number): number => UnicodeTrie.get(codePoint);

const _graphemeBreakAtIndex = (_codePoints: number[], classTypes: number[], index: number): BREAK_OPPORTUNITIES => {
    let prevIndex = index - 2;
    let prev = classTypes[prevIndex];
    const current = classTypes[index - 1];
    const next = classTypes[index];
    // GB3 Do not break between a CR and LF
    if (current === CR && next === LF) {
        return BREAK_NOT_ALLOWED;
    }

    // GB4 Otherwise, break before and after controls.
    if (current === CR || current === LF || current === Control) {
        return BREAK_ALLOWED;
    }

    // GB5
    if (next === CR || next === LF || next === Control) {
        return BREAK_ALLOWED;
    }

    // Do not break Hangul syllable sequences.
    // GB6
    if (current === L && [L, V, LV, LVT].indexOf(next) !== -1) {
        return BREAK_NOT_ALLOWED;
    }

    // GB7
    if ((current === LV || current === V) && (next === V || next === T)) {
        return BREAK_NOT_ALLOWED;
    }

    // GB8
    if ((current === LVT || current === T) && next === T) {
        return BREAK_NOT_ALLOWED;
    }

    // GB9 Do not break before extending characters or ZWJ.
    if (next === ZWJ || next === Extend) {
        return BREAK_NOT_ALLOWED;
    }
    // Do not break before SpacingMarks, or after Prepend characters.
    // GB9a
    if (next === SpacingMark) {
        return BREAK_NOT_ALLOWED;
    }

    // GB9a
    if (current === Prepend) {
        return BREAK_NOT_ALLOWED;
    }

    // GB11 Do not break within emoji modifier sequences or emoji zwj sequences.
    if (current === ZWJ && next === Extended_Pictographic) {
        while (prev === Extend) {
            prev = classTypes[--prevIndex];
        }
        if (prev === Extended_Pictographic) {
            return BREAK_NOT_ALLOWED;
        }
    }

    // GB12 Do not break within emoji flag sequences.
    // That is, do not break between regional indicator (RI) symbols
    // if there is an odd number of RI characters before the break point.
    if (current === RI && next === RI) {
        let countRI = 0;
        while (prev === RI) {
            countRI++;
            prev = classTypes[--prevIndex];
        }
        if (countRI % 2 === 0) {
            return BREAK_NOT_ALLOWED;
        }
    }

    return BREAK_ALLOWED;
};

export const graphemeBreakAtIndex = (codePoints: number[], index: number): BREAK_OPPORTUNITIES => {
    // GB1 Break at the start and end of text, unless the text is empty.
    if (index === 0) {
        return BREAK_ALLOWED;
    }

    // GB2
    if (index >= codePoints.length) {
        return BREAK_ALLOWED;
    }

    const classTypes = codePoints.map(codePointToClass);
    return _graphemeBreakAtIndex(codePoints, classTypes, index);
};

export const GraphemeBreaker = (str: string) => {
    const codePoints = toCodePoints(str);
    const length = codePoints.length;
    let index = 0;
    let lastEnd = 0;
    const classTypes = codePoints.map(codePointToClass);

    return {
        next: () => {
            if (index >= length) {
                return {done: true, value: null};
            }

            let graphemeBreak = BREAK_NOT_ALLOWED;
            while (
                index < length &&
                (graphemeBreak = _graphemeBreakAtIndex(codePoints, classTypes, ++index)) === BREAK_NOT_ALLOWED
            ) {}

            if (graphemeBreak !== BREAK_NOT_ALLOWED || index === length) {
                const value = fromCodePoint.apply(null, codePoints.slice(lastEnd, index));
                lastEnd = index;
                return {value, done: false};
            }

            return {done: true, value: null};
            while (index < length) {}

            return {done: true, value: null};
        },
    };
};

export const splitGraphemes = (str: string): string[] => {
    const breaker = GraphemeBreaker(str);

    const graphemes = [];
    let bk;

    while (!(bk = breaker.next()).done) {
        if (bk.value) {
            graphemes.push(bk.value.slice());
        }
    }

    return graphemes;
};
