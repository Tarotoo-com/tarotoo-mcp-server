#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const here = dirname(fileURLToPath(import.meta.url));
const cards = JSON.parse(
  readFileSync(join(here, 'data', 'cards.json'), 'utf8'),
);
const byName = new Map(cards.map((c) => [c.name.toLowerCase(), c]));

function findCard(name) {
  const key = String(name).trim().toLowerCase();
  if (byName.has(key)) return byName.get(key);
  // tolerate "the" omissions and minor variants, e.g. "fool" -> "The Fool"
  for (const [k, card] of byName) {
    if (k === `the ${key}` || `the ${k}` === key) return card;
  }
  return null;
}

function text(value) {
  return {
    content: [
      {
        type: 'text',
        text:
          typeof value === 'string' ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

function errorText(message) {
  return { content: [{ type: 'text', text: message }], isError: true };
}

const server = new McpServer({ name: 'tarotoo-tarot', version: '1.7.0' });

server.registerTool(
  'get_card_meaning',
  {
    title: 'Get card meaning',
    description:
      'Get the full meaning of a single tarot card from the Tarotoo dataset (Rider-Waite-Smith tradition): upright and reversed meanings and keywords, upright and reversed love, career, mood, and spiritual contexts, element, astrology, and upright and reversed yes/no values. Call this when you need the meaning of a specific card by name.',
    inputSchema: {
      name: z.string().describe('Card name, e.g. "The Fool" or "Ace of Cups"'),
    },
  },
  async ({ name }) => {
    const card = findCard(name);
    if (!card)
      return errorText(
        `Unknown card: "${name}". Use list_cards to see all 78 valid names.`,
      );
    return text(card);
  },
);

server.registerTool(
  'list_cards',
  {
    title: 'List cards',
    description:
      'List tarot card names in the dataset, optionally filtered by arcana (major/minor) or suit (wands/cups/swords/pentacles). Call this to discover valid card names.',
    inputSchema: {
      arcana: z
        .enum(['major', 'minor'])
        .optional()
        .describe('Filter by arcana'),
      suit: z
        .enum(['wands', 'cups', 'swords', 'pentacles'])
        .optional()
        .describe('Filter by suit (minor arcana only)'),
    },
  },
  async ({ arcana, suit }) => {
    let result = cards;
    if (arcana) result = result.filter((c) => c.arcana === arcana);
    if (suit) result = result.filter((c) => c.suit === suit);
    return text(result.map((c) => c.name));
  },
);

server.registerTool(
  'search_cards',
  {
    title: 'Search cards',
    description:
      'Search all 78 tarot cards by theme, keyword, or topic (e.g. "new beginnings", "heartbreak", "career success"). Searches names, keywords, and meaning texts. Returns matching cards with their keywords. Call this when you have a theme rather than a card name.',
    inputSchema: {
      query: z.string().describe('Search term or theme'),
      limit: z
        .number()
        .int()
        .min(1)
        .max(78)
        .optional()
        .describe('Max results (default 10)'),
    },
  },
  async ({ query, limit }) => {
    const q = query.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    const scored = cards
      .map((c) => {
        const haystack = [
          c.name,
          ...c.keywords_upright,
          ...c.keywords_reversed,
          c.meaning_upright,
          c.meaning_reversed,
          c.love,
          c.career,
          c.mood,
          c.spiritual,
        ]
          .join(' ')
          .toLowerCase();
        let score = 0;
        if (c.name.toLowerCase().includes(q)) score += 10;
        for (const t of terms) {
          if (c.keywords_upright.some((k) => k.includes(t))) score += 3;
          if (c.keywords_reversed.some((k) => k.includes(t))) score += 2;
          if (haystack.includes(t)) score += 1;
        }
        return { card: c, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit ?? 10);
    if (scored.length === 0) return text(`No cards matched "${query}".`);
    return text(
      scored.map(({ card }) => ({
        name: card.name,
        keywords_upright: card.keywords_upright,
        keywords_reversed: card.keywords_reversed,
        meaning_upright: card.meaning_upright,
      })),
    );
  },
);

server.registerTool(
  'yes_no_answer',
  {
    title: 'Yes/no answer',
    description:
      'Get the yes/no/maybe value of a tarot card for yes-or-no readings, with the upright meaning as justification. Covers all 78 cards.',
    inputSchema: { name: z.string().describe('Card name') },
  },
  async ({ name }) => {
    const card = findCard(name);
    if (!card)
      return errorText(
        `Unknown card: "${name}". Use list_cards to see all 78 valid names.`,
      );
    return text({
      name: card.name,
      answer: card.yes_no,
      meaning_upright: card.meaning_upright,
    });
  },
);

server.registerTool(
  'draw_cards',
  {
    title: 'Draw cards',
    description:
      "Randomly draw one or more distinct tarot cards from the full 78-card deck, optionally with reversals, returning each card's full meaning. Use for generating a reading spread.",
    inputSchema: {
      count: z
        .number()
        .int()
        .min(1)
        .max(10)
        .optional()
        .describe('Number of cards to draw (default 1)'),
      allow_reversed: z
        .boolean()
        .optional()
        .describe('Whether cards may be drawn reversed (default false)'),
    },
  },
  async ({ count, allow_reversed }) => {
    const n = count ?? 1;
    const deck = [...cards];
    const drawn = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * deck.length);
      const card = deck.splice(idx, 1)[0];
      const reversed = allow_reversed ? Math.random() < 0.5 : false;
      drawn.push({
        name: card.name,
        orientation: reversed ? 'reversed' : 'upright',
        keywords: reversed ? card.keywords_reversed : card.keywords_upright,
        meaning: reversed ? card.meaning_reversed : card.meaning_upright,
        love: reversed ? card.love_reversed : card.love,
        career: reversed ? card.career_reversed : card.career,
        mood: reversed ? card.mood_reversed : card.mood,
        spiritual: reversed ? card.spiritual_reversed : card.spiritual,
        yes_no: reversed ? card.yes_no_reversed : card.yes_no,
      });
    }
    return text(drawn);
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
