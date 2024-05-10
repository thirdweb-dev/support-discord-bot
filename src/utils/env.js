/**
 * This is to handle the environment variables
 */

require("dotenv").config();

const {
  DISCORD_BOT_TOKEN,
  DISCORD_SUPPORT_ROLE_ID,
  CONTEXT_ID,
  ASKAI_CHANNELS,
  REDIS_SERVER_URL
} = process.env;

const discord_bot_token = DISCORD_BOT_TOKEN;
const discord_support_role = DISCORD_SUPPORT_ROLE_ID;
const context_id = CONTEXT_ID;
const askai_channels = ASKAI_CHANNELS;
const redis_server_url = REDIS_SERVER_URL;

module.exports = {
  discord_bot_token,
  discord_support_role,
  context_id,
  askai_channels,
  redis_server_url
};
