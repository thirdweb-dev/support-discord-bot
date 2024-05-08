const { Events } = require("discord.js");
const { client } = require("../bot");
const { sendEmbedMessage, serverTime } = require("../utils/core");
const { version } = require("../../package.json");

module.exports = {
    name: Events.MessageCreate,
    once: false,
    execute(message) {

      // get the details from user who send command
      const member = message.member;
      const mention = message.mentions;

      // prevent someone from sending DM to the bot.
      if (message.author.bot) return;

      /**
       * Admin / Moderator commands
       */

      // check ping
      if (message.content === "!!ping") {
        message.reply({
          embeds: [sendEmbedMessage(`Latency is ${Date.now() - message.createdTimestamp}ms.`)],
        });
        console.log(`[${serverTime()}][log]: responded to ping command`);
      }

      // check version
      if (message.content === "!!version") {
        message.reply({
          embeds: [sendEmbedMessage(`Version: ${version}`)],
        });
        console.log(`[${serverTime()}][log]: responded to version command in version ${version}`);
      }

      /**
       * Response to message events
       */
      // respond to user if the bot mentioned specifically not with everyone
      if (message.mentions.has(client.user) && !message.mentions.everyone) {
        // convert this to embed message.reply({config.mention_message);
        message.reply({
          embeds: [sendEmbedMessage(config.reminder_mention)],
        });
      }

    },
};