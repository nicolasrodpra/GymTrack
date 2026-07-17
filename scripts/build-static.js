import { cp, mkdir, rm } from 'node:fs/promises';

const outputDir = 'dist';
const entries = [
    'index.html',
    'app.css',
    'main.js',
    'profile-sync.js',
    'tailwind-config.js',
    'configuraciones',
    'dashboard',
    'ejercicios',
    'login',
    'progreso',
    'rutinas'
];

await rm(outputDir, { force: true, recursive: true });
await mkdir(outputDir, { recursive: true });

for (const entry of entries) {
    await cp(entry, `${outputDir}/${entry}`, { recursive: true });
}
