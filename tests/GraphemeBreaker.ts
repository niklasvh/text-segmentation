import {deepEqual} from 'assert';
import {GraphemeBreaker, splitGraphemes} from '../src';

describe('GraphemeBreaker', () => {
    it('iterator', () => {
        const breaker = GraphemeBreaker('Text 👨‍👩‍👧‍👦 🤷🏾‍♂️.');

        const graphemes = [];
        let bk;

        while (!(bk = breaker.next()).done) {
            if (bk.value) {
                graphemes.push(bk.value.slice());
            }
        }

        deepEqual(graphemes, ['T', 'e', 'x', 't', ' ', '👨‍👩‍👧‍👦', ' ', '🤷🏾‍♂️', '.']);
    });

    it('.splitGraphemes', () => {
        deepEqual(splitGraphemes('Text 👨‍👩‍👧‍👦 🤷🏾‍♂️.'), ['T', 'e', 'x', 't', ' ', '👨‍👩‍👧‍👦', ' ', '🤷🏾‍♂️', '.']);
    });
});