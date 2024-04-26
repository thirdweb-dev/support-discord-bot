const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientMessageCreate,
    once: false,
    execute(message) {

      // prevent someone from sending DM to the bot.
      if (message.author.bot) return;

      // check ping
      if (message.content === "!!ping") {
        message.reply({
          embeds: [sendEmbedMessage(`Pong: ${client.ws.ping}ms`)],
        });
        console.log(`[log]: responded to ping command in ${client.ws.ping}ms`);
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