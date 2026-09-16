import path from 'path';
import os from 'os';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const isWindows = process.platform === 'win32';
const home = os.homedir();

const cargoBin = path.join(home, '.cargo', 'bin');
const winlibsBin = path.join(
  home,
  'AppData',
  'Local',
  'Microsoft',
  'WinGet',
  'Packages',
  'BrechtSanders.WinLibs.POSIX.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe',
  'mingw64',
  'bin'
);

if (isWindows) {
  // Asegurar que tanto PATH como Path se actualicen en Windows
  const existingPath = process.env.Path || process.env.PATH || '';
  const newPath = `${cargoBin};${winlibsBin};${existingPath}`;
  process.env.PATH = newPath;
  process.env.Path = newPath;
}

const args = process.argv.slice(2);
const tauriCli = require('@tauri-apps/cli');

try {
  await tauriCli.run(args, 'tauri');
} catch (err) {
  if (err) console.error(err);
  process.exit(1);
}
