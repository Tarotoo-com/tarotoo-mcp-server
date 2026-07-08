#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

const requests = [
  {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'smoke-test', version: '0.0.1' },
    },
  },
  { jsonrpc: '2.0', method: 'notifications/initialized' },
  { jsonrpc: '2.0', id: 2, method: 'tools/list' },
  {
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/call',
    params: { name: 'get_card_meaning', arguments: { name: 'the fool' } },
  },
  {
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: { name: 'search_cards', arguments: { query: 'heartbreak', limit: 3 } },
  },
  {
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: { name: 'yes_no_answer', arguments: { name: 'Ten of Swords' } },
  },
  {
    jsonrpc: '2.0',
    id: 6,
    method: 'tools/call',
    params: { name: 'draw_cards', arguments: { count: 3, allow_reversed: true } },
  },
  {
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: { name: 'list_cards', arguments: { suit: 'cups' } },
  },
  {
    jsonrpc: '2.0',
    id: 8,
    method: 'tools/call',
    params: { name: 'get_card_meaning', arguments: { name: 'Nonexistent Card' } },
  },
];

const server = spawn('node', [join(here, 'server.js')], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

let stdout = '';
server.stdout.on('data', (chunk) => (stdout += chunk));
server.stdin.write(requests.map((r) => JSON.stringify(r) + '\n').join(''));
server.stdin.end();

const failures = [];
function check(cond, label) {
  console.log(cond ? 'PASS' : 'FAIL', label);
  if (!cond) failures.push(label);
}

server.on('close', () => {
  const responses = {};
  for (const line of stdout.split('\n')) {
    if (!line.trim()) continue;
    const msg = JSON.parse(line);
    if (msg.id !== undefined) responses[msg.id] = msg;
  }

  const toolText = (id) => JSON.parse(responses[id].result.content[0].text);

  check(responses[1].result.serverInfo.name === 'tarotoo-tarot', 'initialize -> serverInfo');

  const tools = responses[2].result.tools.map((t) => t.name).sort();
  check(
    JSON.stringify(tools) ===
      JSON.stringify(['draw_cards', 'get_card_meaning', 'list_cards', 'search_cards', 'yes_no_answer']),
    `tools/list -> 5 tools`,
  );

  const fool = toolText(3);
  check(fool.name === 'The Fool' && fool.yes_no === 'maybe', "get_card_meaning('the fool') fuzzy match");

  const search = toolText(4);
  check(search.some((c) => c.name === 'Three of Swords'), "search 'heartbreak' finds Three of Swords");

  check(toolText(5).answer === 'no', "yes_no_answer('Ten of Swords') == no");

  const drawn = toolText(6);
  check(
    drawn.length === 3 && new Set(drawn.map((d) => d.name)).size === 3,
    'draw_cards(3) -> 3 distinct cards',
  );

  const cups = toolText(7);
  check(cups.length === 14 && cups.includes('Ace of Cups'), 'list_cards(suit=cups) -> 14 cards');

  check(responses[8].result.isError === true, 'unknown card -> isError');

  console.log(failures.length === 0 ? '\nALL PASS' : `\n${failures.length} FAILURES`);
  process.exit(failures.length === 0 ? 0 : 1);
});
