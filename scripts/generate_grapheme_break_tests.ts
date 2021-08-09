import {readFileSync, writeFileSync} from 'fs';
import {resolve} from 'path';
import {BREAK_NOT_ALLOWED, BREAK_ALLOWED} from '../src/GraphemeBreak';

const data = readFileSync(resolve(__dirname, '../tests/GraphemeBreakTest.txt')).toString();
const tests: string[] = [];
data.split('\n')
    .filter((s) => s.length > 0)
    .forEach((s) => {
        let [input, comment] = s.split('#');
        input = input.trim();

        if (input.length) {
            comment = comment ? comment.trim() : '';
            const inputs = input.split(/\s+/g);
            const codePoints: string[] = [];
            const breaks: string[] = [];
            inputs.forEach((value) => {
                if ([BREAK_ALLOWED, BREAK_NOT_ALLOWED].indexOf(value) !== -1) {
                    breaks.push(value);
                } else {
                    codePoints.push(`0x${value}`);
                }
            });
            tests.push(`it('${comment}', () => test([${codePoints.join(', ')}], ${JSON.stringify(breaks)}));`);
        }
    });

const template = `// Generated tests from GraphemeBreakTest.txt, do NOT modify
'use strict';
import {strictEqual} from 'assert';
import {graphemeBreakAtIndex, codePointToClass, classes} from '../src/GraphemeBreak';

const reverseClasses: {[key: number]: string} = Object.keys(classes).reduce((acc: {[key: number]: string}, key: string) => {
    acc[classes[key]] = key;
    return acc;
}, {});

const test = (codePoints: number[], breaks: string[]) => {
    const types = codePoints.map(codePointToClass);

    breaks.forEach((c: string, i: number) => {
        const b = graphemeBreakAtIndex(codePoints, i);
        strictEqual(b, c, \`\${b} at \${i}, expected \${c} with types \${types.map((type) => reverseClasses[type])}\`);
    });
};

describe('GraphemeBreakTest.txt', () => {
    ${tests.join('\n    ')}
});
`;

writeFileSync(resolve(__dirname, '../tests/grapheme-break.ts'), template);
console.log('Tests created successfully');
