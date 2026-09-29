import fs from 'fs';
import path from 'path';

const dir = 'public/build';

function listDir(directory) {
    if (!fs.existsSync(directory)) {
        console.log(`Directory ${directory} does not exist`);
        return;
    }
    const files = fs.readdirSync(directory);
    files.forEach(file => {
        const fullPath = path.join(directory, file);
        if (fs.statSync(fullPath).isDirectory()) {
            console.log(`DIR: ${fullPath}`);
            listDir(fullPath);
        } else {
            console.log(`FILE: ${fullPath}`);
        }
    });
}

console.log('--- Scanning public/build ---');
listDir(dir);
console.log('--- End Scan ---');
