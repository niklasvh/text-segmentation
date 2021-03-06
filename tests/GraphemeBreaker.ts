import {deepEqual} from 'assert';
import {GraphemeBreaker, splitGraphemes} from '../src';

describe('GraphemeBreaker', () => {
    it('iterator', () => {
        const breaker = GraphemeBreaker('Text ๐จโ๐ฉโ๐งโ๐ฆ ๐คท๐พโโ๏ธ.');

        const graphemes = [];
        let bk;

        while (!(bk = breaker.next()).done) {
            if (bk.value) {
                graphemes.push(bk.value.slice());
            }
        }

        deepEqual(graphemes, ['T', 'e', 'x', 't', ' ', '๐จโ๐ฉโ๐งโ๐ฆ', ' ', '๐คท๐พโโ๏ธ', '.']);
    });

    it('.splitGraphemes', () => {
        deepEqual(splitGraphemes('Text ๐จโ๐ฉโ๐งโ๐ฆ ๐คท๐พโโ๏ธ.'), ['T', 'e', 'x', 't', ' ', '๐จโ๐ฉโ๐งโ๐ฆ', ' ', '๐คท๐พโโ๏ธ', '.']);
    });
});