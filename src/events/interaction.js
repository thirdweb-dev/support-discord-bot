const { Events } = require("discord.js");
const { 
	sendEmbedMessage, 
	serverTime, 
	CloseButtonComponent } = require("../utils/core");
const { ContextSDK } = require("@context-labs/sdk");
const Redis = require("ioredis");

const {
	REDIS_SERVER_URL
} = process.env;

const redis = new Redis(REDIS_SERVER_URL);
const context = new ContextSDK({});

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(interaction) {
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
  }
}