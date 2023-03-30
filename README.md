# Forum-based Support Bot (thirdweb support)

> **Note**: This bot is based from [thread-based-support-discord-bot](https://github.com/warengonzaga/thread-based-support-discord-bot). Converted to fully support the forum posts.

A dedicated forum-based support Discord bot for the thirdweb community.

## How to Use

This bot has only one command to use, for auto closing the posts from forum channels.

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
    "command_prefix": "!",
    "utc_offset": -8,
    "datasheet_init": "init",
    "datasheet_response": "response",
    "datasheet_resolve": "resolve"
}
```

| Config Name | Description |
| --- | --- |
| `resolution_tag_name` | The name of the tag to mark the post resolved. |
| `command_prefix` | A prefix you want to use with `close` command to be recognized by the bot. |
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

The Forum-based Support Bot (thirdweb support) is licensed under [GNU General Public License v3](https://opensource.org/licenses/GPL-3.0).

## 🍀 Sponsor

Love what I do? Send me some [love](https://github.com/sponsors/warengonzaga) or [coffee](https://buymeacoff.ee/warengonzaga)!? 💖☕

Can't send love or coffees? 😥 Nominate me for a **[GitHub Star](https://stars.github.com/nominate)** instead!

> **Note**: Your support means a lot to me as it allows me to dedicate my time and energy to create and maintain open-source projects that benefits the community. Thank you for supporting my mission to make technology better, accessible and inclusive for everyone.🙏😇

## 📝 Author

The Forum-based Support Bot (thirdweb support) is developed and maintained by **[Waren Gonzaga](https://github.com/warengonzaga)**, with the help of awesome [contributors](https://github.com/warengonzaga/thirdweb-support-discord-bot/graphs/contributors) for the [thirdweb community](https://discord.gg/thirdweb).

[![contributors](https://contrib.rocks/image?repo=warengonzaga/thirdweb-support-discord-bot)](https://github.com/warengonzaga/thirdweb-support-discord-bot/graphs/contributors)

---

💻💖☕ by [Waren Gonzaga](https://warengonzaga.com) | [He is Awesome](https://www.youtube.com/watch?v=HHrxS4diLew&t=44s) 🙏
