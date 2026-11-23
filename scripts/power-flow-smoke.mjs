import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.POWER_BASE_URL ?? 'http://127.0.0.1:5173';
const output = process.env.POWER_SCREENSHOTS ?? 'outputs/power-flow';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args:
    process.env.POWER_SOFTWARE === '1'
      ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
      : [],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    sessionStorage.setItem('pc-anatomy-performance-tip-v1', '1');
    localStorage.setItem('pc-anatomy-first-visit-hint-v1', '1');
  });
  const click = (name) => {
    console.log('Click:', name);
    return page
      .getByRole('button', { name, exact: true })
      .evaluate((button) => button.click());
  };
  const ready = async (level = 'pc', explode = 0) => {
    await page.waitForFunction(
      ({ level, explode }) => {
        const d = document.querySelector('.viewport')?.dataset;
        return (
          d?.level === level &&
          Number(d.explode) === explode &&
          d.cameraSettled === 'true' &&
          Number(d.triangles) > 0
        );
      },
      { level, explode },
      { timeout: 60000 },
    );
    assert.deepEqual(errors, []);
  };
  const routes = (expected) =>
    page.waitForFunction(
      (expected) =>
        document.querySelector('.viewport')?.dataset.powerRoutes === expected,
      expected,
      { timeout: 30000 },
    );
  const capture = (name) =>
    page.screenshot({ path: `${output}/${name}.png`, timeout: 60000 });
  await page.goto(base);
  await ready();
  await routes('');
  await capture('power-before');
  await click('Mostrar flujo de alimentación');
  await routes('atx,eps,gpu,sata,slot');
  await capture('power-all');
  for (const [target, expected] of [
    ['CPU', 'eps'],
    ['GPU', 'atx,gpu,slot'],
    ['Discos', 'sata'],
  ]) {
    await click(target);
    await routes(expected);
    await capture(`power-${target.toLowerCase()}`);
  }
  await click('GPU');
  await click('Ocultar Placa base');
  await routes('gpu');
  await click('Mostrar Placa base');
  await routes('atx,gpu,slot');
  await click('Inspeccionar Graphics card: 12V-2x6');
  await page
    .getByRole('heading', { name: 'Tarjeta gráfica', exact: true })
    .waitFor();
  await click('Aislar');
  await routes('');
  await click('Mostrar entorno');
  await routes('atx,gpu,slot');
  await click('Ocultar');
  await routes('atx');
  await click('Mostrar Tarjeta gráfica');
  await routes('atx,gpu,slot');
  await click('Desmontaje');
  await ready('pc', 50);
  await routes('');
  assert.match(await page.locator('.power-status').innerText(), /Reassemble/);
  await click('Montado');
  await ready();
  await routes('atx,gpu,slot');
  await click('Inspeccionar Graphics card: 12V-2x6');
  await page
    .getByRole('button', { name: /^Explorar / })
    .evaluate((button) => button.click());
  await ready('card');
  assert.equal(await page.locator('.power-toggle').count(), 0);
  await page.goBack();
  await ready();
  await routes('atx,gpu,slot');
  await click('Restablecer cámara y montaje');
  await ready();
  await routes('');
  assert.equal(await page.locator('.power-panel').count(), 0);
  await click('Mostrar flujo de alimentación');
  await click('CPU');
  await routes('eps');
  // Keyboard activation while reduced motion is enabled.
  await page.getByRole('button', { name: 'GPU', exact: true }).focus();
  await page.keyboard.press('Enter');
  await routes('atx,gpu,slot');
  for (const [width, height] of [
    [390, 844],
    [320, 740],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await ready();
    const bounds = await page.locator('.power-panel').boundingBox();
    assert.ok(
      bounds &&
        bounds.x >= 0 &&
        bounds.y >= 0 &&
        bounds.x + bounds.width <= width + 1 &&
        bounds.y + bounds.height <= height,
      JSON.stringify(bounds),
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      'No horizontal overflow',
    );
    await capture(`power-mobile-${width}`);
    if (width <= 700) {
      assert.equal(await page.locator('.power-legend').isVisible(), false);
      await click('Detalles');
      assert.equal(await page.locator('.power-legend').isVisible(), true);
      await capture(`power-mobile-${width}-details`);
      await click('Menos');
    }
  }
  assert.deepEqual(errors, []);
  // The stage reads the motion preference when mounted. Reload to exercise
  // the ordinary animated mode as well as the static mode above.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.reload();
  await ready();
  await click('Mostrar flujo de alimentación');
  await routes('atx,eps,gpu,sata,slot');
  await click('Ocultar flujo de alimentación');
  await routes('');
  assert.deepEqual(errors, []);
  console.log(
    'Power flow: filters, inspection, visibility, isolation, disassembly, navigation, reset, keyboard, motion preferences and responsive layouts passed.',
  );
} finally {
  await browser.close();
}
