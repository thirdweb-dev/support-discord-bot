const { Events } = require("discord.js");
const {
  sendEmbedMessage,
  serverTime,
  FeedbackButtonComponent } = require("../utils/core");

const { getAIResponse } = require("../utils/nebula")
const { version } = require("../../package.json");
const config = require("../config.json");
const redis = require("./database");

// discord bot env
const {
  DISCORD_SUPPORT_ROLE_ID,
  ASKAI_CHANNEL} = process.env;
const roleIDs = DISCORD_SUPPORT_ROLE_ID.split(",");


module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(message) {

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
     * User commands
     */

    // respond to ask command
    if ((message.content.startsWith('!askai') || message.content.startsWith('!ask'))) {
      let question = message.content.startsWith('!askai') ? message.content.slice(6) : message.content.slice(4);

      // check if there's a question, if not, send the getting started message, if there's a question, send the response
      if (!question) {
        message.reply({
          content: `Hey <@${message.author.id}> 👇`,
          embeds: [sendEmbedMessage(config.getting_started_ai_message)],
        });
      } else {
        if (message.channel.id === ASKAI_CHANNEL) {
          let aiMessageLoading = await message.channel.send({
            embeds: [sendEmbedMessage(config.ai_thinking_message)],
          });
          let response = await getAIResponse(question)
          await message.channel.messages.fetch(aiMessageLoading.id).then((msg) => {
            msg.edit({
              content: `Hey <@${message.author.id}> 👇`,
              embeds: [
                sendEmbedMessage(`${response.message}`),
              ],
              components: [FeedbackButtonComponent()],

            })
            const data = {
              request_id: response.request_id,
              session_id: response.session_id,
            };
            redis.set(msg.id,  JSON.stringify(data));
          }
          );
          // to do
          // send a message indicates unseccesful response from the AI
          // await message.channel.messages.fetch(aiMessageLoading.id).then((msg) =>
          // msg.edit({
          //   content: `Hey <@${message.author.id}> 👇`,
          //  embeds: [
          // sendEmbedMessage(`**Response:**\nI'm sorry, I couldn't find a response to your question. Please try again later.`),
          //   ],

          //  })
          // );

        } else {
          // if the command is not from the channel
          message.reply({
            content: `Hey <@${message.author.id}> 👇`,
            embeds: [sendEmbedMessage(`thirdweb only provides via our official support portal (https://thirdweb.com/support), anyone saying otherwise is fake and should not be trusted`)],
          });
        }
      }
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