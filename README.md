# Forum-based Support Bot (thirdweb support)

> **Note**: I moved the whole source code to the new repository focusing on the thread-based support bot. You can check it out here [thread-based-support-discord-bot](https://github.com/warengonzaga/thread-based-support-discord-bot). I'm going to transform this repository to focus on forum channels for Discord communities.

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
    "utc_offset": -8,
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
| `utc_offset` | Time and date UTC offset for recording the data. |
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

## 📃 License

The Thread-based Support Bot (thirdweb support) is licensed under [GNU General Public License v3](https://opensource.org/licenses/GPL-3.0).

## 🍀 Sponsor

Love what I do? Send me some [love](https://github.com/sponsors/warengonzaga) or [coffee](https://buymeacoff.ee/warengonzaga)!? 💖☕

Can't send love or coffees? 😥 Nominate me for a **[GitHub Star](https://stars.github.com/nominate)** instead!

> **Note**: Your support means a lot to me as it allows me to dedicate my time and energy to create and maintain open-source projects that benefits the community. Thank you for supporting my mission to make technology better, accessible and inclusive for everyone.🙏😇

## 📝 Author

The Thread-based Support Bot (thirdweb support) is developed and maintained by **[Waren Gonzaga](https://github.com/warengonzaga)**, with the help of awesome [contributors](https://github.com/warengonzaga/thirdweb-support-discord-bot/graphs/contributors) for the [thirdweb community](https://discord.gg/thirdweb).

[![contributors](https://contrib.rocks/image?repo=warengonzaga/thirdweb-support-discord-bot)](https://github.com/warengonzaga/thirdweb-support-discord-bot/graphs/contributors)

---

💻💖☕ by [Waren Gonzaga](https://warengonzaga.com) | [He is Awesome](https://www.youtube.com/watch?v=HHrxS4diLew&t=44s) 🙏
