import { expect, test, type Page } from '@playwright/test';

async function sideButton(page: Page, button: 'back' | 'forward') {
  const viewport = await page.locator('.viewport').boundingBox();
  if (!viewport) throw new Error('The viewer is outside the viewport');
  const session = await page.context().newCDPSession(page);
  const mouse = {
    x: viewport.x + viewport.width / 2,
    y: viewport.y + viewport.height / 2,
    button,
    clickCount: 1,
  };
  try {
    await session.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      ...mouse,
    });
    await session.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      ...mouse,
    });
  } finally {
    await session.detach();
  }
}

test('side buttons restore the previous module, selection and disassembly', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === 'mobile',
    'Extra mouse buttons are a desktop input',
  );
  await page.goto('/?scale=pc&part=graphicscard&open=48');
  await expect(page.locator('.detail-panel')).toContainText('Tarjeta gráfica');
  await expect(page.locator('.detail-panel [lang="en"]').first()).toHaveText(
    'Graphics card',
  );

  await page.getByRole('button', { name: 'Buscar un componente' }).click();
  await page.getByPlaceholder(/Prueba con memoria/).fill('RTX 5090');
  await page.locator('[cmdk-item][data-value="card"]').click();
  await expect(page).toHaveURL(/scale=card/);

  await sideButton(page, 'back');
  await expect(page).toHaveURL(/part=graphicscard&open=48/);
  await expect(page.locator('.disassembly output')).toHaveText('48%');
  await expect(page.locator('.detail-panel')).toContainText('Tarjeta gráfica');

  await sideButton(page, 'forward');
  await expect(page).toHaveURL(/scale=card/);
  await page.getByRole('button', { name: 'Atrás', exact: true }).click();
  await expect(page).toHaveURL(/part=graphicscard&open=48/);
});

test('the back button can climb to the parent of a direct link', async ({
  page,
}) => {
  await page.goto('/?scale=card');
  await expect(
    page.getByRole('heading', { name: 'Tarjeta gráfica RTX 5090' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Atrás', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'PC de escritorio' }),
  ).toBeVisible();
  const slider = page.getByRole('slider', { name: 'Desmontar el modelo' });
  await expect(slider).toHaveAttribute('aria-valuenow', '0');
  await page.getByRole('button', { name: 'Inventario', exact: true }).click();
  await expect(slider).toHaveAttribute('aria-valuenow', '100');
});
