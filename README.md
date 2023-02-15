# Support Fren (thirdweb support)

Dedicated thread-based support Discord bot for the thirdweb community.

## How to Use

1. React with emoji to start a thread.
2. Only specified role can start a thread.
3. React with emoji or prefix command to close a thread.

## Configurations

### Config File

```json
{
    "emoji_assign": "👀",
    "emoji_close": "✅",
    "command_prefix": "!",
    "auto_archive_duration": 10080
}
```

| Config Name | Description |
| --- | --- |
| `emoji_assign` | Emoji you want to use as a trigger to initiate a thread support. |
| `emoji_close` | Emoji you want to use as a trigger to close and lock the thread support. |
| `command_prefix` | A prefix you want to use with `close` command to be recognized by the bot. |

## Environment Variables

```env
DISCORD_BOT_TOKEN=<discord_bot_token>
DISCORD_SUPPORT_ROLE_ID=<role_id>,<role_id>
```

## Development

### Install the packages

```bash
yarn install
```

### Run the bot

```bash
yarn dev
```

## Todo

- Analytics (in progress)

## License

Support Fren (thirdweb support) Discord Bot is licensed under [GNU General Public License v3](https://opensource.org/licenses/GPL-3.0).

---

💻💖☕ by [Waren Gonzaga](https://warengonzaga.com) | [He is Awesome](https://www.youtube.com/watch?v=HHrxS4diLew&t=44s) 🙏
