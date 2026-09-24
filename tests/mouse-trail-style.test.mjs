import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const mouseTrail = source.match(/const MouseTrail = \(\) => \{[\s\S]*?\n\};/u)?.[0];

assert.ok(mouseTrail, 'MouseTrail component should exist');
assert.match(mouseTrail, /className="absolute rounded-\[6px\] overflow-hidden shadow-2xl"/u, 'wrapper should not render a border');
assert.doesNotMatch(mouseTrail, /className="absolute[^"]*\bborder\b/u, 'wrapper should not include border utilities');
assert.match(mouseTrail, /style=\{\{ width: '150px' \}\}/u, 'wrapper should not force a height');
assert.match(mouseTrail, /className="block w-full h-auto"/u, 'image should preserve its intrinsic aspect ratio');

console.log('mouse-trail images are borderless and preserve full image ratios');
