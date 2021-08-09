import {writeFileSync, readFileSync} from 'fs';
import {resolve} from 'path';
import {classes} from '../src/GraphemeBreak';
import {TrieBuilder, serializeBase64} from 'utrie';

const rawData = readFileSync(resolve(__dirname, '../src/GraphemeBreakProperty.txt')).toString();
const emojiRawData = readFileSync(resolve(__dirname, '../src/emoji-data.txt')).toString();
const builder = new TrieBuilder(classes.Other);

rawData
    .split('\n')
    .map((s) => {
        const index = s.indexOf('#');
        const first = (index === -1 ? s : s.substring(0, index)).trim();
        return index === -1
            ? [first]
            : [
                  first,
                  s
                      .substring(index + 1)
                      .trim()
                      .split(/\s+/)[0]
                      .trim(),
              ];
    })
    .filter(([s]) => s.length > 0)
    .forEach(([s]) => {
        const [input, type] = s.split(';').map((v) => v.trim());
        const [start, end] = input.split('..');

        const classType: number = classes[type];
        if (!classType) {
            console.error(`Invalid class type "${type}" found`);
            process.exit(1);
        }

        const startInt = parseInt(start, 16);
        const endInt = end ? parseInt(end, 16) : startInt;

        if (startInt !== endInt && endInt !== null) {
            builder.setRange(startInt, endInt, classType, true);
        } else {
            builder.set(startInt, classType);
        }
    });

emojiRawData
    .split('\n')
    .map((s) => {
        const index = s.indexOf('#');
        const first = (index === -1 ? s : s.substring(0, index)).trim();
        return index === -1
            ? [first]
            : [
                  first,
                  s
                      .substring(index + 1)
                      .trim()
                      .split(/\s+/)[0]
                      .trim(),
              ];
    })
    .filter(([s]) => s.length > 0)
    .forEach(([s]) => {
        const [input, type] = s.split(';').map((v) => v.trim());
        const [start, end] = input.split('..');

        const classType: number = classes[type];
        if (classType) {
            const startInt = parseInt(start, 16);
            const endInt = end ? parseInt(end, 16) : startInt;

            if (startInt !== endInt && endInt !== null) {
                builder.setRange(startInt, endInt, classType, true);
            } else {
                builder.set(startInt, classType);
            }
        }
    });
// Define emoji regional indicators
builder.setRange(0x1f1e6, 0x1f1ff, classes.RI, true);

const [base64, byteLength] = serializeBase64(builder.freeze(16));
writeFileSync(
    resolve(__dirname, '../src/grapheme-break-trie.ts'),
    [`export const base64 = "${base64}";`, `export const byteLength = ${byteLength};`].join('\n')
);
console.log(`Trie created successfully`);
