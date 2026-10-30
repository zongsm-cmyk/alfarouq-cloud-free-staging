import http from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const send = (res, status, payload, headOnly = false) => {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'content-length': Buffer.byteLength(body),
  });
  res.end(headOnly ? undefined : body);
};

/** Safe deployability canary. It cannot read or execute ALFAROUQ tasks. */
export function createAppServer() {
  return http.createServer((req, res) => {
    let route;
    try { route = new URL(req.url, 'http://localhost').pathname; }
    catch { return send(res, 400, { ok: false, error: 'invalid_path' }); }

    if (route === '/health' && (req.method === 'GET' || req.method === 'HEAD')) {
      return send(res, 200, { ok: true, component: 'alfarouq-cloud-free-staging', environment: 'isolated', production_connected: false }, req.method === 'HEAD');
    }
    if (route === '/ready' && req.method === 'GET') {
      return send(res, 503, { ok: false, reason: 'production_broker_and_durable_store_not_qualified' });
    }
    if (/^\/(?:v1|api|commands|tasks|queue)(?:\/|$)/.test(route)) {
      return send(res, 503, { ok: false, error: 'external_effects_disabled', effect_boundary: 'NOT_CROSSED' });
    }
    return send(res, 404, { ok: false, error: 'not_found' });
  });
}

const invokedDirectly = !!process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);
if (invokedDirectly) {
  const port = Number(process.env.PORT || '10000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('Invalid PORT');
  createAppServer().listen(port, '0.0.0.0', () => console.log('staging-only listening on ' + port));
}
