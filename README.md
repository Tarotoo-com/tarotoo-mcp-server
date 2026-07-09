# Tarotoo MCP Server

[![npm](https://img.shields.io/npm/v/tarotoo-mcp-server)](https://www.npmjs.com/package/tarotoo-mcp-server)
[![CI](https://github.com/Tarotoo-com/tarotoo-mcp-server/actions/workflows/test.yml/badge.svg)](https://github.com/Tarotoo-com/tarotoo-mcp-server/actions)
[![MCP Registry](https://img.shields.io/badge/MCP%20registry-io.github.Tarotoo--com%2Ftarotoo--mcp--server-7b47c9)](https://registry.modelcontextprotocol.io/v0/servers?search=tarotoo)
[![Node](https://img.shields.io/node/v/tarotoo-mcp-server)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

A [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI assistants — Claude, ChatGPT, Cursor, and any other MCP client — live access to the [Tarotoo tarot card meanings dataset](https://github.com/Tarotoo-com/tarotoo-tarot-dataset): all **78 cards** in the Rider–Waite–Smith tradition, with upright/reversed meanings, keywords, love, career, mood and spiritual contexts, planet and zodiac associations, and yes/no values.

Published by [Tarotoo](https://tarotoo.com) as part of its [AI transparency initiative](https://tarotoo.com/open-data): these are the same card meanings that ground the AI readings on Tarotoo.com.

## Quick start

Requires Node.js ≥ 18. No installation needed — clients run it via `npx`.

**Claude Code**

```bash
claude mcp add tarotoo-tarot -- npx -y tarotoo-mcp-server
```

**Claude Desktop** — add to `claude_desktop_config.json` (Settings → Developer → Edit Config):

```json
{
  "mcpServers": {
    "tarotoo-tarot": {
      "command": "npx",
      "args": ["-y", "tarotoo-mcp-server"]
    }
  }
}
```

**Cursor / Windsurf / other MCP clients** — same `command`/`args` pair in the client's MCP settings.

**MCP registry** — listed as [`io.github.Tarotoo-com/tarotoo-mcp-server`](https://registry.modelcontextprotocol.io/v0/servers?search=tarotoo), so registry-aware clients can discover and install it directly.

Then ask your assistant things like *"what does the Three of Swords mean for my career?"* or *"draw three cards for me"* — it will call the tools below.

## Tools

| Tool | Arguments | Returns |
|---|---|---|
| `get_card_meaning` | `name` (string) | Full record for one card — meanings, keywords, love/career/mood/spiritual, planet, zodiac, yes/no, URL. Name matching is forgiving (`"fool"` → The Fool) |
| `list_cards` | `arcana?` (`major`/`minor`), `suit?` (`wands`/`cups`/`swords`/`pentacles`) | Card names, optionally filtered |
| `search_cards` | `query` (string), `limit?` (1–78, default 10) | Cards matching a theme or keyword, best match first — e.g. `"heartbreak"` → Three of Swords |
| `yes_no_answer` | `name` (string) | The card's `yes`/`no`/`maybe` value with its upright meaning as justification |
| `draw_cards` | `count?` (1–10, default 1), `allow_reversed?` (boolean) | Random distinct cards with orientation-appropriate meanings — for generating spreads |

## Example

```
tools/call get_card_meaning {"name": "the star"}
```

```json
{
  "name": "The Star",
  "arcana": "major",
  "element": "Air",
  "planet": "Saturn",
  "zodiac": "Aquarius",
  "yes_no": "yes",
  "keywords_upright": ["hope", "renewal", "healing", "inspiration", "faith"],
  "meaning_upright": "Hope, renewal, healing, inspiration, and faith.",
  "url": "https://tarotoo.com/tarot-card-meanings/the-star"
}
```

## Run from source

```bash
git clone https://github.com/Tarotoo-com/tarotoo-mcp-server.git
cd tarotoo-mcp-server
npm install
npm test        # 8-check smoke test: full MCP session over stdio
node server.js  # stdio transport
```

## Dataset

The embedded `data/cards.json` is built from [tarotoo-tarot-dataset](https://github.com/Tarotoo-com/tarotoo-tarot-dataset) ([MIT](https://github.com/Tarotoo-com/tarotoo-tarot-dataset/blob/main/LICENSE)), which is also available on [Hugging Face](https://huggingface.co/datasets/Tarotoo/tarotoo-tarot-card-meanings), [Kaggle](https://www.kaggle.com/datasets/tarotoo/tarotoo-tarot-card-meanings), [npm](https://www.npmjs.com/package/tarotoo-tarot), and [PyPI](https://pypi.org/project/tarotoo-tarot/), with a citable DOI: [10.5281/zenodo.21268290](https://doi.org/10.5281/zenodo.21268290).

Interpretations are original writing by Tarotoo in the Rider–Waite–Smith tradition, grounded exclusively in public-domain works (A. E. Waite's *The Pictorial Key to the Tarot*, 1911; attributions per the Golden Dawn's *Book T*).

## License

Code and dataset: [MIT](LICENSE). Attribution to Tarotoo (tarotoo.com) is appreciated.

## Responsible use

Tarot readings are for entertainment and self-reflection only — not medical, legal, financial, or mental-health advice.
