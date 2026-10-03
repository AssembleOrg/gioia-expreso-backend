// Descarga el Chromium headless de Playwright dentro de node_modules
// (PLAYWRIGHT_BROWSERS_PATH=0), así viaja con la app al contenedor de Railway
// y en local queda en el mismo lugar. pdf.service.ts busca ahí.
const { execFileSync } = require('child_process');
const path = require('path');

process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0';
execFileSync(
  process.execPath,
  [
    path.join(path.dirname(require.resolve('playwright-core/package.json')), 'cli.js'),
    'install',
    'chromium-headless-shell',
  ],
  { stdio: 'inherit', env: process.env },
);
