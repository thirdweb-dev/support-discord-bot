const { Events, Client, GatewayIntentBits, Partials } = require("discord.js");
const { sendEmbedMessage } = require("../utils/core");
const { version } = require("../../package.json");

module.exports = {
    name: Events.MessageCreate,
    once: false,
    execute(message) {

      // prevent someone from sending DM to the bot.
      if (message.author.bot) return;

      // check ping
      if (message.content === "!!ping") {
        message.reply({
          embeds: [sendEmbedMessage(`Latency is ${Date.now() - message.createdTimestamp}ms.`)],
        });
        console.log(`[log]: responded to ping command`);
      }

      // check version
      if (message.content === "!!version") {
        message.reply({
          embeds: [sendEmbedMessage(`Version: ${version}`)],
        });
        console.log(`[log]: responded to version command in version ${version}`);
      }

    },
};