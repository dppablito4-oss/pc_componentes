import assert from 'node:assert/strict';
import { test } from 'node:test';
import { manifest, searchConcepts } from '../lib/manifest.ts';
import { bilingualPartName, partNameEs } from '../lib/locale-es.ts';
import { filterComparisonItems } from '../lib/comparison-catalogue.ts';

await test('every catalogue entry has a Spanish name and preserves its English name', () => {
  for (const part of manifest) {
    assert.notEqual(partNameEs(part), part.name, part.id);
    assert.equal(bilingualPartName(part), `${partNameEs(part)} · ${part.name}`);
  }
});

await test('search finds component and comparison names in both languages', () => {
  for (const query of ['tarjeta grafica', 'tarjeta gráfica', 'graphics card']) {
    assert.ok(
      searchConcepts(query).some(({ id }) => id === 'graphicscard'),
      query,
    );
  }
  assert.ok(
    filterComparisonItems({ query: 'tarjeta gráfica' }).some(
      ({ level }) => level === 'card',
    ),
  );
});
