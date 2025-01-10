const { Events } = require("discord.js");
const {
	sendEmbedMessage,
	serverTime,
	CloseButtonComponent } = require("../utils/core");
const { sendAIFeedback } = require("../utils/nebula")
const redis = require("./database");
const config = require("../config.json");

module.exports = {
	name: Events.InteractionCreate,
	once: false,
	async execute(interaction) {
		let messageId = interaction.message.id

		// check if the interaction is a button click
		if (interaction.isButton()) {

			if (interaction.customId === "helpful") {
				await interaction.reply({
					embeds: [sendEmbedMessage(config.helpful_message)],
					content: `🔔 <@${interaction.user.id}>`,
					ephemeral: true,
				});
				await redis.get(messageId, async (err, result) => {
					if (err) {
						console.error(err);
					} else {
						const data = JSON.parse(result);
						
						await sendAIFeedback(
							data.session_id,
							data.request_id,
							true,
						);
					}
				});
				await interaction.message.edit({ components: [] });
				await redis.del(messageId);

				// log the feedback
				console.log(`[${serverTime()}][log]: User sent a "Helpful" feedback!`);
			}

			if (interaction.customId === "not-helpful") {
				
				await interaction.reply({
					embeds: [sendEmbedMessage(config.not_helpful_messsage)],
					content: `🔔 <@${interaction.user.id}>`,
					ephemeral: true,
					components: [CloseButtonComponent()],
				});
				
				await redis.get(messageId, async (err, result) => {
					if (err) {
						console.error(err);
					} else {
                        const data = JSON.parse(result);
						await sendAIFeedback(
							data.session_id,
							data.request_id,
							true,
						);
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