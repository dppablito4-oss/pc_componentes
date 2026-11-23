import { expect, test } from '@playwright/test';

test('the HUD keeps its canvas size and selection while panels are toggled', async ({
  page,
}, testInfo) => {
  await page.goto('/?scale=pc&part=graphicscard&open=48');
  const canvas = page.locator('.viewport');
  const size = page.viewportSize()!;
  expect(await canvas.boundingBox()).toEqual({ x: 0, y: 0, ...size });

  const layers = page.getByRole('button', { name: 'Explorador', exact: true });
  const inspector = page.getByRole('button', { name: 'Inspector de pieza' });
  const detail = page.locator('#part-inspector');
  await expect(detail).toBeVisible();
  await expect(
    detail.getByRole('tab', { name: 'Propiedades' }),
  ).toHaveAttribute('aria-selected', 'true');
  await detail.getByRole('tab', { name: 'Documentación' }).click();
  await expect(
    detail.getByRole('tabpanel').getByRole('link').first(),
  ).toBeVisible();

  const accent = page.getByLabel('Color dominante');
  for (const value of ['#10B981', '#3B82F6', '#8B5CF6', '#F97316']) {
    await accent.selectOption(value);
    await expect(page.locator('html')).toHaveCSS('--accent-primary', value);
  }

  await inspector.click();
  await expect(detail).toBeHidden();
  await expect(page).toHaveURL(/part=graphicscard&open=48/);
  await inspector.click();
  await expect(
    detail.getByRole('heading', { name: 'Tarjeta gráfica' }),
  ).toBeVisible();

  const mobile = testInfo.project.name === 'mobile';
  await expect(layers).toHaveAttribute(
    'aria-expanded',
    mobile ? 'false' : 'true',
  );
  if (!mobile) await layers.click();
  await expect(page.locator('#explorer-panel')).toBeHidden();
  await layers.click();
  await expect(page.getByRole('checkbox', { name: 'Gráficos' })).toBeVisible();
  if (mobile) await layers.click();
  expect(await canvas.boundingBox()).toEqual({ x: 0, y: 0, ...size });

  await page.getByRole('button', { name: 'Vista frontal' }).click();
  await expect(
    page.getByRole('button', { name: 'Vista frontal' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page
    .getByRole('button', { name: 'Restablecer cámara y montaje' })
    .click();
  await expect(page.getByRole('button', { name: 'Vista 3d' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('.disassembly output')).toHaveText('0%');
  await expect(detail).toBeVisible();

  if (mobile) await layers.click();
  await page.getByRole('checkbox', { name: 'Gráficos' }).uncheck();
  await page.getByRole('button', { name: 'Ocultar todo', exact: true }).click();
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Mostrar todo', exact: true }).click();
  await expect(page.getByRole('checkbox', { checked: false })).toHaveCount(0);
});
