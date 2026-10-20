#!/usr/bin/env node
/**
 * Sends a push notification to every device that registered with the
 * notification server.
 *
 *   node scripts/send-push.mjs --title "Hello" --body "World"
 *   node scripts/send-push.mjs --title "Hello" --body "World" --data '{"url":"/profile"}'
 *   node scripts/send-push.mjs --title "Hello" --body "World" --dry-run
 */
import { readFile } from 'node:fs/promises';

import {
  buildMessages,
  chunk,
  readTokens,
  sendMessages,
} from './expo-push.mjs';

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (!current.startsWith('--')) {
      continue;
    }

    const key = current.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = next;
    index += 1;
  }

  return args;
}

const args = parseArgs(process.argv.slice(2));

const title = typeof args.title === 'string' ? args.title : 'Esmor';
const body = typeof args.body === 'string' ? args.body : '';
const channelId = typeof args.channel === 'string' ? args.channel : undefined;
const priority = typeof args.priority === 'string' ? args.priority : undefined;
const sound = typeof args.sound === 'string' ? args.sound : undefined;
const ttl = typeof args.ttl === 'string' ? Number(args.ttl) : undefined;
const badge = typeof args.badge === 'string' ? Number(args.badge) : undefined;

let data;

if (typeof args['data-file'] === 'string') {
  try {
    const raw = await readFile(args['data-file'], 'utf8');
    data = JSON.parse(raw);
  } catch (error) {
    console.error(`Could not read the data file: ${args['data-file']}`);
    console.error(error.message);
    process.exit(1);
  }
} else if (typeof args.data === 'string') {
  try {
    data = JSON.parse(args.data);
  } catch (error) {
    console.error('--data must be valid JSON.');
    console.error(error.message);
    console.error('On Windows PowerShell escape the quotes, or use --data-file.');
    process.exit(1);
  }
}

const tokens = await readTokens();

if (!tokens.length) {
  console.error('No devices are registered yet.');
  console.error('Start the notification server and let the app register first.');
  process.exit(1);
}

const messages = buildMessages(tokens, {
  title,
  body,
  data,
  channelId,
  priority,
  sound,
  ttl,
  badge,
});

if (args['dry-run']) {
  console.log(JSON.stringify(messages, null, 2));
  process.exit(0);
}

const accessToken = process.env.EXPO_ACCESS_TOKEN ?? null;
const tickets = [];

for (const batch of chunk(messages)) {
  const result = await sendMessages(batch, { accessToken });
  tickets.push(...(result.data ?? []));
}

const failed = tickets.filter((ticket) => ticket.status === 'error');

console.log(`Sent ${messages.length} notification(s).`);

for (const ticket of failed) {
  console.error(`  error: ${ticket.message}`);
}

process.exit(failed.length > 0 ? 1 : 0);
