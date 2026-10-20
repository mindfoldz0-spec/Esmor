#!/usr/bin/env node
/**
 * A tiny notification server for development.
 *
 * It collects the Expo push tokens that the app registers, and it can push
 * any payload to every registered device through the Expo Push Service.
 *
 *   node scripts/push-server.mjs
 *   curl -X POST http://localhost:8787/send \
 *     -H "Content-Type: application/json" \
 *     -d '{"title":"Hello","body":"From the server","data":{"url":"/profile"}}'
 *
 * Point the app at it with EXPO_PUBLIC_NOTIFICATION_SERVER_URL.
 */
import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';

import {
  buildMessages,
  chunk,
  readTokens,
  sendMessages,
  upsertToken,
  writeTokens,
} from './expo-push.mjs';

const PORT = Number(process.env.PUSH_SERVER_PORT ?? 8787);
const ACCESS_TOKEN = process.env.EXPO_ACCESS_TOKEN ?? null;

function json(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  response.end(JSON.stringify(payload, null, 2));
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return {};
  }
}

function lanAddress() {
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }

  return 'localhost';
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${PORT}`);

  if (request.method === 'OPTIONS') {
    json(response, 204, {});
    return;
  }

  if (request.method === 'GET' && url.pathname === '/') {
    json(response, 200, {
      name: 'Esmor notification server',
      endpoints: {
        'GET /tokens': 'List the registered devices',
        'POST /register': 'Register a device push token',
        'POST /send': 'Send a notification to every registered device',
      },
      example: {
        title: 'Hello',
        body: 'This came from the notification server.',
        data: { url: '/profile' },
      },
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/tokens') {
    const tokens = await readTokens();
    json(response, 200, { count: tokens.length, tokens });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/register') {
    const body = await readJsonBody(request);

    if (!body?.token || typeof body.token !== 'string') {
      json(response, 400, { error: 'A push token is required.' });
      return;
    }

    const tokens = await readTokens();
    upsertToken(tokens, {
      token: body.token,
      platform: body.platform ?? 'unknown',
      projectId: body.projectId ?? null,
      registeredAt: body.registeredAt ?? new Date().toISOString(),
    });

    await writeTokens(tokens);
    json(response, 200, { registered: true, count: tokens.length });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/send') {
    const body = await readJsonBody(request);
    const tokens = await readTokens();

    if (!tokens.length) {
      json(response, 400, { error: 'No devices are registered yet.' });
      return;
    }

    const messages = buildMessages(tokens, {
      title: body.title ?? 'Esmor',
      body: body.body ?? '',
      subtitle: body.subtitle,
      data: body.data,
      channelId: body.channelId,
      badge: body.badge,
      sound: body.sound,
      ttl: body.ttl,
      priority: body.priority,
    });

    const tickets = [];

    for (const batch of chunk(messages)) {
      const result = await sendMessages(batch, { accessToken: ACCESS_TOKEN });
      tickets.push(...(result.data ?? []));
    }

    json(response, 200, { sent: messages.length, tickets });
    return;
  }

  json(response, 404, { error: 'Unknown endpoint.' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Esmor notification server listening on port ${PORT}`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${lanAddress()}:${PORT}`);
  console.log('');
  console.log('Set EXPO_PUBLIC_NOTIFICATION_SERVER_URL to the network address');
  console.log('so a device can register its push token.');
});
