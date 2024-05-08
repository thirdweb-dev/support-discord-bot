const { Events } = require("discord.js");
const { sendEmbedMessage, serverTime } = require("../utils/core");
const { version } = require("../../package.json");
const config = require("./config.json");

// discord bot env
const {
	DISCORD_SUPPORT_ROLE_ID,
	ASKAI_CHANNEL
} = process.env;
const roleIDs = DISCORD_SUPPORT_ROLE_ID.split(",");

module.exports = {
    name: Events.MessageCreate,
    once: false,
    execute(message) {

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
      if (message.mentions.has(message.client.user) && !message.mentions.everyone) {
        // convert this to embed message.reply({config.mention_message);
        message.reply({
          embeds: [sendEmbedMessage(config.reminder_mention)],
        });
      }

      // get the details from user who send command
      const member = message.member;
      const mention = message.mentions;

      // check if the message has mentioned a team member and not a reply
      if (mention.users.first() && !message.reference) {
        let mentioned = message.guild.members.cache.get(mention.users.first().id)
        if (mentioned.roles.cache.hasAny(...roleIDs) && !member.roles.cache.hasAny(...roleIDs)) {
          message.reply({
            embeds: [sendEmbedMessage(`We have moved to a community driven discord support model.\n\nYou can ask me all things thirdweb in the <#${ASKAI_CHANNEL}> channel. Use the command \`!askai\` or \`!ask\` followed by your question to get started.`)],
          }).then(msg => {
            setTimeout(() => msg.delete(), 60000)
          })
        }
      }

    },
};