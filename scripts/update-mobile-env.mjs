import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ipAddress = execFileSync('ipconfig', ['getifaddr', 'en0'], {
  encoding: 'utf8',
}).trim();

const apiURL = `http://${ipAddress}:3001`;
const envLine = `EXPO_PUBLIC_API_URL=${apiURL}`;
const envPath = path.join(process.cwd(), 'apps/mobile/.env.local');

if (existsSync(envPath)) {
  const currentEnv = readFileSync(envPath, 'utf8');
  const updatedEnv = currentEnv.replace(/^EXPO_PUBLIC_API_URL=.*/m, envLine);
  writeFileSync(envPath, updatedEnv);
} else {
  writeFileSync(envPath, `${envLine}\n`);
}

console.log(`Updated mobile API RUL: ${apiURL}`);
