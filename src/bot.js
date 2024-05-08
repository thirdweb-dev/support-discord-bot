const fs = require("fs");
const path = require("node:path");
const {
	Client,
	GatewayIntentBits,
	Partials,
} = require("discord.js");
const config = require("./config.json");
const {
	sendEmbedMessage,
	CloseButtonComponent,
	FeedbackButtonComponent,
	serverTime,
} = require("./utils/core");

// usecontext.ai imports
const { ContextSDK } = require("@context-labs/sdk");
const Redis = require("ioredis");

require("dotenv").config();

// discord bot tokens
const {
	DISCORD_BOT_TOKEN,
	DISCORD_SUPPORT_ROLE_ID,
	CONTEXT_ID,
	ASKAI_CHANNEL,
	REDIS_SERVER_URL
} = process.env;

const token = DISCORD_BOT_TOKEN;
const roleIDs = DISCORD_SUPPORT_ROLE_ID.split(",");

// discord bot instents and partials
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
	],
	partials: [Partials.Channel, Partials.Message],
});
const redis = new Redis(REDIS_SERVER_URL);
//create context instance
const context = new ContextSDK({});

// listen to post messages
client.on("messageCreate", async (message) => {

	// respond to ask command
	if ((message.content.startsWith('!askai') || message.content.startsWith('!ask'))) {
		let question = message.content.startsWith('!askai') ? message.content.slice(6) : message.content.slice(4);
		const gettingStartedASKAI = `Hello, kindly use \`!ask\` or \`!askai\` followed by your question to get started.`;

		// check if there's a question, if not, send the getting started message, if there's a question, send the response
		if (!question) {
			message.reply({
				content: `Hey <@${message.author.id}> 👇`,
				embeds: [sendEmbedMessage(gettingStartedASKAI)],
			});
		} else {
			if (message.channel.id === ASKAI_CHANNEL) {
				let aiMessageLoading = await message.channel.send({
					embeds: [
						sendEmbedMessage("**🤖 Beep Boop Boop Beep:** " + `<a:load:1210497921158619136> thinking...`),
					],
				});

				await context.query({
					botId: CONTEXT_ID,
					query: question,
					onComplete: async (query) => {
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
						}
						);

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
					embeds: [sendEmbedMessage(`You can ask me all things thirdweb in the <#${ASKAI_CHANNEL}> channel. Just type your question after the command \`!askai\` or \`!ask\` to get started.`)],
				});
			}
		}
	}

});

//listen to button clicks
client.on("interactionCreate", async (interaction) => {
	let messageId = interaction.message.id

	// check if the interaction is a button click
	if (interaction.isButton()) {

		if (interaction.customId === "helpful") {
			await interaction.reply({
				embeds: [sendEmbedMessage(`Thank you so much for your feedback!`)],
				content: `🔔 <@${interaction.user.id}>`,
				ephemeral: true,
			});
			await redis.get(messageId, async (err, result) => {
				if (err) {
					console.error(err);
				} else {
					await context.setQueryFeedback({
						queryId: result,
						helpful: true,
					});
				}
			});
			await interaction.message.edit({ components: [] });
			await redis.del(messageId);

			// log the feedback
			console.log(`[${serverTime()}][log]: User sent a "Helpful" feedback!`);
		}
		
		if (interaction.customId === "not-helpful") {
			await interaction.reply({
				embeds: [sendEmbedMessage(`Thank you for your valuable feedback, this will help us improve the responses of our AI assistant.\n\nIn the meantime, would you like to contact a human customer success agent? Just click the link or the button below to submit a ticket.`)],
				content: `🔔 <@${interaction.user.id}>`,
				ephemeral: true,
				components: [CloseButtonComponent()],
			});
			await redis.get(messageId, async (err, result) => {
				if (err) {
					console.error(err);
				} else {
					await context.setQueryFeedback({
						queryId: result,
						helpful: false,
					});
				}
			});
			await interaction.message.edit({ components: [] });
			await redis.del(messageId);

			// log the feedback
			console.log(`[${serverTime()}][log]: User sent a "Not Helpful" feedback!`);
		}
	}
});

/**
 * Don't modify or update the code below.
 * Keep your changes above ^
 */

// reading events file
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
	.readdirSync(eventsPath)
	.filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

//  check if the Redis is ready then log in the bot to Discord
redis.on("ready", () => {
  console.log(`[${serverTime()}][log]: Redis is ready!`);

	// log in to Discord with your client's token
	client.login(token);
});
