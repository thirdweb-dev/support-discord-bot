# Support Fren (thirdweb support)

Dedicated thread-based support Discord bot for the thirdweb community.

## How to Use

1. React with emoji to start a thread.
2. Only specified role can start a thread.

## Configurations

```json
{
    "support_role_id": "956550878813384737",
    "emoji_assign": "👀",
    "emoji_close": "✅",
    "emoji_status_open": "🟣",
    "emoji_status_resolved": "🟢",
    "dev_mode": false
}
```

`support_role_id` - ID of the role you want to allow to initiate a thread support.

`emoji_assign` - What emoji you want to use as a trigger to initiate a thread support.

`emoji_close` - What emoji you want to use as a trigger to close and lock the thread support.

`emoji_status_open` - What emoji you want to use as prefix in thread name if status open.

`emoji_status_resolved` - What emoji you want to use as prefix in thread name if status resolved.

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

- Analytics
- Support multiple roles
