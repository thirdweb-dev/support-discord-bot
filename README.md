# Thread-based Support Bot (thirdweb support)

Dedicated thread-based support Discord bot for the thirdweb community.

## How to Use

1. React with emoji to start a thread.
2. Only specified role can start a thread.
3. React with emoji or prefix command to close a thread.

### Commands

To close thread using prefix command.

```bash
!close
```

To close the thread and resolved by the username mentioned

```bash
!close @username
```

## Configurations

### Config File

```json
{
    "emoji_assign": "👀",
    "emoji_close": "✅",
    "command_prefix": "!",
    "auto_archive_duration": 10080,
    "datasheet_init": "init",
    "datasheet_response": "response",
    "datasheet_resolve": "resolve"
}
```

| Config Name | Description |
| --- | --- |
| `emoji_assign` | Emoji you want to use as a trigger to initiate a thread support. |
| `emoji_close` | Emoji you want to use as a trigger to close and lock the thread support. |
| `command_prefix` | A prefix you want to use with `close` command to be recognized by the bot. |
| `auto_archive_duration` | Auto Archive Duration for your threads, `10080` for 1 week (in minutes). |
| `datasheet_init` | Refers to the sheet name in your google spreadsheet. This should be the first sheet in the order. |
| `datasheet_response` | Refers to the sheet name in your google spreadsheet. This should be the second sheet in the order. |
| `datasheet_resolve` | Refers to the sheet name in your google spreadsheet. This should be the third sheet in the order. |

## Environment Variables

```env
DISCORD_BOT_TOKEN=<discord_bot_token>
DISCORD_SUPPORT_ROLE_ID=<role_id>,<role_id>
GOOGLE_PRIVATE_KEY=<private_key>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<service_email_account>
GOOGLE_SPREADSHEET_ID=<google_spreadsheet_id>
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

## 📝 Author

The Thread-based Support Bot (thirdweb support) is developed and maintained by **[Waren Gonzaga](https://github.com/warengonzaga)**, with the help of awesome [contributors](https://github.com/warengonzaga/thirdweb-support-discord-bot/graphs/contributors) for the [thirdweb community](https://discord.gg/thirdweb).

[![contributors](https://contrib.rocks/image?repo=warengonzaga/thirdweb-support-discord-bot)](https://github.com/warengonzaga/thirdweb-support-discord-bot/graphs/contributors)

## License

The Thread-based Support Bot (thirdweb support) is licensed under [GNU General Public License v3](https://opensource.org/licenses/GPL-3.0).

---

💻💖☕ by [Waren Gonzaga](https://warengonzaga.com) | [He is Awesome](https://www.youtube.com/watch?v=HHrxS4diLew&t=44s) 🙏
