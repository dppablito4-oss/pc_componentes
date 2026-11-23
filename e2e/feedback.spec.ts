import { expect, test, type Page } from '@playwright/test';

const MESSAGE = 'The RTX 5090 enables 170 SMs, the page says 172.';

async function openForm(page: Page) {
  await page.goto('/');
  const button = page.getByRole('button', { name: /^(Comentarios|Opinar)$/ });
  await expect(button).toBeVisible();
  await button.click();
  await expect(
    page.getByRole('dialog', { name: 'Enviar comentarios' }),
  ).toBeVisible();
}

test('Feedback is the first header control, and clear of the others', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  const actions = page.locator('.header-actions > *');
  // The full label on desktop, "Feedback" alone on a phone.
  await expect(actions.first()).toHaveAccessibleName(
    testInfo.project.name === 'mobile' ? 'Opinar' : 'Comentarios',
  );
  const feedback = (await actions.first().boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(feedback.x).toBeGreaterThanOrEqual(0);
  expect(feedback.x + feedback.width).toBeLessThanOrEqual(viewport.width);
  const others = page.locator(
    '.topbar .brand, .topbar .byline, .header-actions > *:not(.feedback-button)',
  );
  for (const other of await others.all()) {
    const box = await other.boundingBox();
    if (!box) continue; // hidden at this size
    const apart =
      box.x >= feedback.x + feedback.width || box.x + box.width <= feedback.x;
    expect(apart, (await other.getAttribute('class')) ?? '').toBe(true);
  }
});

test('sends the message and its context', async ({ page }) => {
  let posted: Record<string, unknown> | null = null;
  await page.route('**/api/contact', async (route) => {
    posted = route.request().postDataJSON();
    await route.fulfill({ json: { ok: true } });
  });
  await openForm(page);
  await page.getByRole('radio', { name: 'Idea o sugerencia' }).check();
  await page.getByLabel('Nombre').fill('Ada');
  await page.getByLabel(/^Correo/).fill('ada@example.com');
  await page.getByLabel('Mensaje').fill(MESSAGE);
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();

  await expect(page.getByText('Gracias, enviamos tu mensaje.')).toBeVisible();
  expect(posted).toMatchObject({
    kind: 'idea',
    name: 'Ada',
    email: 'ada@example.com',
    message: MESSAGE,
    website: '',
    language: 'es',
  });
  expect(String(posted!.page)).toMatch(/^http:\/\/127\.0\.0\.1:4173\//);
  expect(String(posted!.selection)).not.toBe('');

  await page.getByRole('button', { name: 'Enviar otro mensaje' }).click();
  await expect(page.getByLabel('Mensaje')).toHaveValue('');
});

test('without a function, offers a GitHub issue and keeps the draft', async ({
  page,
}) => {
  await openForm(page);
  await page.getByLabel('Mensaje').fill(MESSAGE);
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();

  const issue = page.getByRole('link', { name: 'Abrir un reporte en GitHub' });
  await expect(issue).toBeVisible();
  await expect(issue).toHaveAttribute(
    'href',
    'https://github.com/Yoosseph/pc-anatomy/issues/new',
  );
  await page.getByRole('button', { name: 'Volver al formulario' }).click();
  await expect(page.getByLabel('Mensaje')).toHaveValue(MESSAGE);
});

test('a closed form keeps what was typed', async ({ page }) => {
  await openForm(page);
  await page.getByLabel('Mensaje').fill(MESSAGE);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await page.getByRole('button', { name: /^(Comentarios|Opinar)$/ }).click();
  await expect(page.getByLabel('Mensaje')).toHaveValue(MESSAGE);
});

test('a refused send says why', async ({ page }) => {
  const answers = [
    { status: 429, text: 'Inténtalo de nuevo en unos minutos' },
    { status: 502, text: 'No se pudo enviar' },
    { status: 400, text: 'Revisa que el mensaje' },
  ];
  let i = 0;
  await page.route('**/api/contact', (route) =>
    route.fulfill({ status: answers[i].status, json: { error: 'x' } }),
  );
  await openForm(page);
  await page.getByLabel('Mensaje').fill(MESSAGE);
  for (; i < answers.length; i++) {
    await page.getByRole('button', { name: 'Enviar', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText(answers[i].text);
  }
});
