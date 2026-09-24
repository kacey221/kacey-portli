import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');

assert.match(source, /setCurrentPage\('video-portfolio'\);\s*\n\s*\}\s*:\s*undefined/u);
assert.match(source, /if \(newCount >= 4\)/u);
assert.match(source, /const addProject = \(\) => \{[\s\S]*?if \(isVideoPortfolioPage\)/u);
assert.match(source, /if \(!isVideoPortfolioPage \|\| isAdminMode\) return;/u);
assert.match(source, /const \[videoProjects, setVideoProjects\]/u);
assert.match(source, /setVideoProjects\(prev => \[\.\.\.prev, \{/u);
assert.match(source, /setVideoProjects\(prev => prev\.filter\(project => project\.id !== item\.id\)\)/u);
assert.match(source, /VIDEO_HOME_COVER/u);
assert.match(source, /const isVideoProject = selectedProject\?\.id < 0;/u);
