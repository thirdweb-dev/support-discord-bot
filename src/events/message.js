const { Events } = require("discord.js");
const {
  sendEmbedMessage,
  FeedbackButtonComponent,
  serverTime,
  localMode,
} = require("../utils/core");
const { version } = require("../../package.json");
const config = require("../config.json");
const redis = require("../utils/database");
const { context, contextID } = require("../utils/ai");
const { discord_support_role, askai_channels } = require("../utils/env");

const roleIDs = discord_support_role.split(",");
const askChannelIDs = askai_channels.split(",");

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
      console.log(`[${serverTime()}][LOG]: responded to ping command`);
    }

    // check version
    if (message.content === "!!version") {
      message.reply({
        embeds: [sendEmbedMessage(`Version: ${version}`)],
      });
      console.log(`[${serverTime()}][LOG]: responded to version command in version ${version}`);
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
        if (askChannelIDs.includes(message.channel.id)) {
          let aiMessageLoading = await message.channel.send({
            embeds: [sendEmbedMessage(config.ai_thinking_message)],
          });

          await context.query({
            botId: contextID,
            query: question,
            onComplete: async (query) => {

              // check if local mode is active or not
              if(!localMode()) {
                // respond to the user with the answer from the AI
                await message.channel.messages.fetch(aiMessageLoading.id).then((msg) => {
                  msg.edit({
                    content: `Hey <@${message.author.id}> 👇`,
                    embeds: [
                      sendEmbedMessage(`**Response:**\n${query.output.toString()}`),
                    ],
                    components: [FeedbackButtonComponent()],

                  })
                  redis.set(msg.id, query._id);
                });
              } else {
                // respond to the user with the answer from the AI
                await message.channel.messages.fetch(aiMessageLoading.id).then((msg) => {
                  msg.edit({
                    content: `Hey <@${message.author.id}> 👇`,
                    embeds: [
                      sendEmbedMessage(`**Response:**\n${query.output.toString()}`),
                    ]
                  })
                });
              }

            },
            onError: async (error) => {
              console.error(error);

              // send a message indicates unseccesful response from the AI
              await message.channel.messages.fetch(aiMessageLoading.id).then((msg) =>
                msg.edit({
                  content: `Hey <@${message.author.id}> 👇`,
                  embeds: [
                    sendEmbedMessage(`**Response:**\nI'm sorry, I couldn't find a response to your question. Please try again later.`),
                  ],

                })
              );

            },
          });

        } else {
          // if the command is not from the channel
          message.reply({
            content: `Hey <@${message.author.id}> 👇`,
            embeds: [sendEmbedMessage(config.reminder_outside_channel)],
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
          embeds: [sendEmbedMessage(config.response_team_mention)],
        }).then(msg => {
          setTimeout(() => msg.delete(), 60000)
        })
      }
    }

  },
};