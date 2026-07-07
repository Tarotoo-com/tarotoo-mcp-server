# Tarotoo MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server that gives AI assistants (Claude, ChatGPT, Cursor, and any other MCP client) live access to the [Tarotoo tarot card meanings dataset](https://github.com/Tarotoo-com/tarotoo-tarot-dataset) — all 78 cards in the Rider–Waite–Smith tradition, with upright/reversed meanings, keywords, love and career contexts, and yes/no values.

Published by [Tarotoo](https://tarotoo.com) as part of its AI transparency initiative: these are the same card meanings that ground the AI readings on Tarotoo.com.

## Tools

| Tool               | Description                                                           |
| ------------------ | --------------------------------------------------------------------- |
| `get_card_meaning` | Full meaning of a card by name (tolerates minor name variants)        |
| `list_cards`       | List card names, filterable by arcana or suit                         |
| `search_cards`     | Search cards by theme or keyword, e.g. "new beginnings", "heartbreak" |
| `yes_no_answer`    | A card's yes/no/maybe value for yes-or-no readings                    |
| `draw_cards`       | Randomly draw 1–10 distinct cards, optionally reversed, with meanings |

## Usage

Requires Node.js 18+.

### Claude Desktop / Claude Code

Add to your MCP configuration (`claude_desktop_config.json`, or `claude mcp add`):

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

### From a local clone

```bash
git clone https://github.com/Tarotoo-com/tarotoo-mcp-server.git
cd tarotoo-mcp-server
npm install
node server.js
```

The server communicates over stdio.

## Dataset

The embedded `data/cards.json` comes from [tarotoo-tarot-dataset](https://github.com/Tarotoo-com/tarotoo-tarot-dataset) (CC BY 4.0), also available on Hugging Face and Kaggle. Interpretations are grounded in A. E. Waite's _The Pictorial Key to the Tarot_ (1911, public domain), written in Tarotoo's editorial voice.

## License

Code: [MIT](LICENSE). Dataset: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), attribution to Tarotoo (tarotoo.com).

## For entertainment and self-reflection purposes

Tarot readings are for entertainment and self-reflection only — not medical, legal, financial, or mental-health advice.
