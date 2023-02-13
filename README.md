# Support Fren (thirdweb support)

Dedicated thread-based support Discord bot for the thirdweb community.

## How to Use

1. React with emoji to start a thread.
2. Only specified role can start a thread.
3. React with emoji or prefix command to close a thread.

## Configurations

```json
{
    "support_role_id": [
        "956550878813384737",
        "1074492077183860868"
    ],
    "emoji_assign": "👀",
    "emoji_close": "✅",
    "command_prefix": "!",
    "dev_mode": false
}
```

| Config Name | Description |
| --- | --- |
| `support_role_id` | Allowed IDs to initiate creation of threads from emoji reaction. |
| `emoji_assign` | Emoji you want to use as a trigger to initiate a thread support. |
| `emoji_close` | Emoji you want to use as a trigger to close and lock the thread support. |
| `command_prefix` | A prefix you want to use with `close` command to be recognized by the bot. |
| `dev_mode` | It should be false, unless you are developing this bot. Optional |

## Development

Set to true if you are developing the bot and has a dev version of bot (bot token for development).

`dev_mode` - Development purposes, optional as long as you know what you are doing.

Install the packages

```bash
yarn install
```

Run the bot

```bash
yarn dev
```

## Todo

- Analytics (in progress)

## License

Support Fren (thirdweb support) Discord Bot is licensed under [GNU General Public License v3](https://opensource.org/licenses/GPL-3.0).

---

💻💖☕ by [Waren Gonzaga](https://warengonzaga.com) | [He is Awesome](https://www.youtube.com/watch?v=HHrxS4diLew&t=44s) 🙏
