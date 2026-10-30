import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createAppServer } from './server.mjs';

async function withServer(fn) {
  const server = createAppServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try { await fn('http://127.0.0.1:' + server.address().port); }
  finally { await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve())); }
}

test('live endpoint truthfully identifies staging, not production', async () => {
  await withServer(async base => {
    const response = await fetch(base + '/health');
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.ok, true);
    assert.equal(data.production_connected, false);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  });
});

test('readiness is explicitly closed until a durable authenticated broker exists', async () => {
  await withServer(async base => {
    const response = await fetch(base + '/ready');
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ok, false);
  });
});

test('commands and queue paths can never execute or accept a write', async () => {
  await withServer(async base => {
    for (const route of ['/v1/commands', '/api/jobs', '/tasks', '/queue/push']) {
      const response = await fetch(base + route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ request_id: 'synthetic-never-send' }) });
      assert.equal(response.status, 503, route);
      const data = await response.json();
      assert.equal(data.effect_boundary, 'NOT_CROSSED');
      assert.equal(data.error, 'external_effects_disabled');
    }
  });
});

test('unknown endpoints stay unavailable, with no CORS exposure', async () => {
  await withServer(async base => {
    const response = await fetch(base + '/admin', { method: 'GET' });
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  });
});

test('HEAD /health has no response body', async () => {
  await withServer(async base => {
    const response = await fetch(base + '/health', { method: 'HEAD' });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '');
  });
});
