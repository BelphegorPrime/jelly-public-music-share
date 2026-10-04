import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const rootDirectory = fileURLToPath(new URL('../', import.meta.url));
const outputDirectory = path.resolve(
  rootDirectory,
  process.env.SCREENSHOT_OUTPUT_DIR || 'docs/screenshots'
);
function parseArguments(args) {
  const routes = [];
  let themes = ['light', 'dark'];

  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === '--theme' || argument.startsWith('--theme=')) {
      const theme = argument === '--theme' ? args[++index] : argument.split('=')[1];
      if (!['light', 'dark', 'both'].includes(theme)) {
        throw new Error('Theme must be light, dark, or both.');
      }
      themes = theme === 'both' ? ['light', 'dark'] : [theme];
    } else if (argument.startsWith('-')) {
      throw new Error(`Unknown option: ${argument}`);
    } else {
      routes.push(argument);
    }
  }

  return {
    routes: routes.length > 0 ? routes : ['/', '/login', '/play/demo-token'],
    themes,
  };
}

const { routes, themes } = parseArguments(process.argv.slice(2));
const sampleTrack = {
  id: 'sample-track-1',
  name: 'Northbound Lights',
  artist: 'Mira Vale',
  album: 'Paper Satellites',
  duration: [3, 30],
  type: 'Audio',
  image: null,
  source: 'Jellyfin',
};
const secondSampleTrack = {
  ...sampleTrack,
  id: 'sample-track-2',
  name: 'Between the Signals',
  artist: 'The Quiet Hours',
  album: 'Rooms in the Sky',
};
const sampleLyrics = [
  { Start: 0, Text: 'Through the quiet, follow the glow' },
  { Start: 120000000, Text: 'Past the lines we used to know' },
  { Start: 240000000, Text: 'Every signal finds its way' },
];

function createSilentWav() {
  const sampleRate = 8000;
  const dataSize = sampleRate * 2;
  const audio = Buffer.alloc(44 + dataSize);
  audio.write('RIFF', 0);
  audio.writeUInt32LE(36 + dataSize, 4);
  audio.write('WAVEfmt ', 8);
  audio.writeUInt32LE(16, 16);
  audio.writeUInt16LE(1, 20);
  audio.writeUInt16LE(1, 22);
  audio.writeUInt32LE(sampleRate, 24);
  audio.writeUInt32LE(sampleRate * 2, 28);
  audio.writeUInt16LE(2, 32);
  audio.writeUInt16LE(16, 34);
  audio.write('data', 36);
  audio.writeUInt32LE(dataSize, 40);
  return audio;
}

async function getAvailablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}

function getScreenshotName(routeUrl, theme) {
  const segments = routeUrl.pathname.split('/').filter(Boolean);
  const routeName = segments.length > 0 ? segments.join('-') : 'library';
  const safeName = routeName.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
  return `${safeName || 'route'}-${theme}.png`;
}

async function waitForServer(serverProcess, baseUrl) {
  const timeoutAt = Date.now() + 15000;

  while (Date.now() < timeoutAt) {
    if (serverProcess.exitCode !== null) {
      throw new Error('The Vite development server exited before it was ready.');
    }

    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  throw new Error(`Timed out waiting for the frontend at ${baseUrl}`);
}

async function mockApi(page) {
  const silentAudio = createSilentWav();

  await page.route('**/api/**', async route => {
    const { pathname } = new URL(route.request().url());
    const json = body => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });

    if (pathname === '/api/auth/login') {
      return json({ token: 'screenshot-demo-token', expiresIn: 3600 });
    }
    if (pathname === '/api/auth/verify') {
      return json({ valid: true, username: 'demo' });
    }
    if (pathname === '/api/request') {
      return json(route.request().method() === 'POST'
        ? { playUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/play/demo-token` }
        : []);
    }
    if (pathname === '/api/search') {
      return json({ results: [sampleTrack, secondSampleTrack] });
    }
    if (pathname.startsWith('/api/validate/')) {
      const token = pathname.split('/').at(-1);
      if (token === 'expired') return json({ expired: true });
      if (token === 'not-found') return json({ notFound: true });
      return json({ valid: true });
    }
    if (pathname.startsWith('/api/songData/')) {
      return json({ itemInfo: sampleTrack });
    }
    if (pathname.startsWith('/api/lyrics/')) {
      return json({ lyrics: sampleLyrics });
    }
    if (pathname.startsWith('/api/stream/')) {
      return route.fulfill({ status: 200, contentType: 'audio/wav', body: silentAudio });
    }

    return route.fulfill({ status: 404, body: 'No screenshot API fixture for this route.' });
  });
}

async function captureRoute(browser, baseUrl, routePath, theme) {
  if (!routePath.startsWith('/')) {
    throw new Error(`Route must start with '/': ${routePath}`);
  }

  const routeUrl = new URL(routePath, baseUrl);
  if (routeUrl.origin !== new URL(baseUrl).origin) {
    throw new Error(`Route must stay on the configured app origin: ${routePath}`);
  }

  const page = await browser.newPage({
    viewport: { width: 1365, height: 1000 },
    colorScheme: theme,
    reducedMotion: 'reduce',
  });
  const viewportHeight = routeUrl.pathname === '/'
    ? 850
    : routeUrl.pathname === '/login'
      ? 800
      : 550;
  await page.setViewportSize({ width: 1365, height: viewportHeight });
  await page.addInitScript(themeName => {
    localStorage.setItem('theme', themeName);
    localStorage.setItem('authToken', 'screenshot-demo-token');
  }, theme);
  await mockApi(page);

  try {
    await page.goto(routeUrl.href, { waitUntil: 'networkidle' });

    if (routeUrl.pathname === '/') {
      await page.getByRole('heading', { name: 'Music Library' }).waitFor();
      await page.getByPlaceholder('Search songs, artists, albums...').fill('northbound');
      await page.getByRole('button', { name: 'Search' }).click();
      await page.getByText(sampleTrack.name).waitFor();
      await page.getByText(secondSampleTrack.name).waitFor();
    } else if (routeUrl.pathname === '/login') {
      await page.getByPlaceholder('Username').waitFor();
    } else if (routeUrl.pathname.startsWith('/play/')) {
      const token = routeUrl.pathname.split('/').at(-1);
      if (token === 'expired') {
        await page.getByRole('heading', { name: 'Link Expired' }).waitFor();
      } else if (token === 'not-found') {
        await page.getByRole('heading', { name: 'Song Not Found' }).waitFor();
      } else {
        await page.getByText(sampleTrack.name).waitFor();
        await page.getByText(sampleLyrics[0].Text).waitFor();
        await page.getByRole('heading', { name: 'Playing Song' }).waitFor();
      }
    }

    const screenshotPath = path.join(outputDirectory, getScreenshotName(routeUrl, theme));
    await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });
    console.log(`${routePath} (${theme}) -> ${path.relative(rootDirectory, screenshotPath)}`);
  } finally {
    await page.close();
  }
}

async function stopServer(serverProcess) {
  if (!serverProcess || serverProcess.exitCode !== null) return;
  serverProcess.kill('SIGTERM');
  await new Promise(resolve => serverProcess.once('exit', resolve));
}

async function main() {
  for (const route of routes) {
    if (!route.startsWith('/')) throw new Error(`Route must start with '/': ${route}`);
  }

  await mkdir(outputDirectory, { recursive: true });
  let serverProcess;
  let browser;

  try {
    const baseUrl = process.env.SCREENSHOT_BASE_URL || `http://127.0.0.1:${await getAvailablePort()}`;

    if (!process.env.SCREENSHOT_BASE_URL) {
      const vitePath = path.join(rootDirectory, 'client', 'node_modules', 'vite', 'bin', 'vite.js');
      const port = new URL(baseUrl).port;
      serverProcess = spawn(process.execPath, [vitePath, '--host', '127.0.0.1', '--port', port, '--strictPort'], {
        cwd: path.join(rootDirectory, 'client'),
        stdio: 'ignore',
      });
      await waitForServer(serverProcess, baseUrl);
    }

    browser = await chromium.launch({
      headless: true,
      args: process.platform === 'linux' ? ['--no-sandbox'] : [],
    });

    for (const route of routes) {
      for (const theme of themes) {
        await captureRoute(browser, baseUrl, route, theme);
      }
    }
  } finally {
    await browser?.close();
    await stopServer(serverProcess);
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});