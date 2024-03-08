const fs = require("fs");
const moment = require("moment");
const path = require("node:path");
const {
	Client,
	ChannelType,
	GatewayIntentBits,
	Partials,
} = require("discord.js");
const config = require("./config.json");
const {
	sendEmbedMessage,
	formatTime,
	getURLFromMessage,
	serverTime,
	CloseButtonComponent,
	FeedbackButtonComponent,
} = require("./utils/core");
const { sendData } = require("./utils/database");

// temporary import for email command, please remove this if not needed.
const { EmbedBuilder } = require("discord.js");

// usecontext.ai imports
const { ContextSDK } = require("@context-labs/sdk");

// package.json
const { version } = require("../package.json");

require("dotenv").config();

// discord bot tokens
const { 
	DISCORD_BOT_TOKEN, 
	DISCORD_SUPPORT_ROLE_ID, 
	CONTEXT_ID, 
	ASKAI_CHANNEL } = process.env;

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

//create context instance
const context = new ContextSDK({});

// listen to post messages
client.on("messageCreate", async (message) => {
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
	if (message.channel.id === ASKAI_CHANNEL && message.content.startsWith('!askai') || message.channel.id === ASKAI_CHANNEL &&  message.content.startsWith('!ask')) {
		let question = message.content.startsWith('!askai') ? message.content.slice(6) : message.content.slice(4)
		let aiMessageLoading = await message.channel.send({
			embeds: [
				sendEmbedMessage("**🤖 Beep Boop Boop Beep:** " + `<a:load:1210497921158619136> thinking...`),
			],
		});
		await context.query({
			botId: CONTEXT_ID,
			query: question,
			onComplete: async (query) => {
				// console.log(query.output.toString())
				await message.channel.messages.fetch(aiMessageLoading.id).then((msg) =>
					msg.edit({
						content: `Hey <@${message.author.id}> 👇`,
						embeds: [
							sendEmbedMessage(`**Response:**\n${query.output.toString()}`),
						],

					})
				);

			},
			onError: (error) => {
				console.error(error);
			},
		});

	}
	// respond to user if the bot mentioned specifically not with everyone
	if (message.mentions.has(client.user) && !message.mentions.everyone) {
		// convert this to embed message.reply({config.mention_message);
		message.reply({
			embeds: [sendEmbedMessage(config.reminder_mention)],
		});
	}

	// get the details from user who send command
	const member = message.member;
	const mention = message.mentions;

	// get the forum details, from posts to tags
	const forum = client.guilds.cache.get(message.guild.id);
	const post = forum.channels.cache.get(message.channel.parent.id);

	// check if the message is from the forum post
	if (typeof post.availableTags !== "undefined") {
		// filter the tags to get the resolution tag name ID
		const resolutionTag = post.availableTags.filter((item) => {
			return item.name == config.tag_name_resolve;
		});
		const closeTag = post.availableTags.filter((item) => {
			return item.name == config.tag_name_close;
		});
		const escalateTag = post.availableTags.filter((item) => {
			return item.name == config.tag_name_escalate;
		});
		const bugTag = post.availableTags.filter((item) => {
			return item.name == config.tag_name_bug;
		});
		// get the existing tags of the post
		const postTags = message.channel.appliedTags;

		// check if the message has the command prefix
		if (message.content.startsWith(config.command_prefix)) {
			await message.delete(); // delete the commmand message

			// check if the message is in the forum post and from the support role
			if (
				message.channel.type === ChannelType.PublicThread &&
				member.roles.cache.hasAny(...roleIDs)
			) {
				// check if the post has fewer tags
				if (postTags.length < 5) {
					// gather data
					const postId = message.channel.id;
					const statusTime = formatTime(message.createdTimestamp);
					const statusBy = member.user.username;

					const sendFirstResponse = () => {
						sendData(
							{
								post_id: postId,
								first_response: statusTime,
								responder: statusBy,
							},
							config.datasheet_response
						);
					};

					// functions for resolve command
					if (
						message.content.includes(config.command_resolve) ||
						message.content.includes(config.command_sc_resolve)
					) {
						// collect tags and add resolve tag
						let initialTags = [resolutionTag[0].id, ...postTags].filter(
							(item) => {
								return item != escalateTag[0].id;
							}
						);
						let tags = [...new Set(initialTags)];

						// send embed message upon executing the resolve command
						await message.channel.send({
							embeds: [sendEmbedMessage(`${config.reminder_resolve}`)],
							content: `🔔 <@${message.channel.ownerId}>`,
						});

						// then archive / close it
						message.channel.edit({
							appliedTags: tags,
							archived: false,
						});

						// check if there's a mentioned user
						if (mention.users.first()) {
							// send the data, use the mentioned user as resolvedBy
							sendData(
								{
									post_id: postId,
									resolution_time: statusTime,
									resolved_by: mention.users.first().username,
								},
								config.datasheet_resolve
							);

							if (message.content.includes("!sf")) {
								sendFirstResponse();
							}
						} else {
							// send the data with the one who sends the command
							sendData(
								{
									post_id: postId,
									resolution_time: statusTime,
									resolved_by: statusBy,
								},
								config.datasheet_resolve
							);

							if (message.content.includes("!sf")) {
								sendFirstResponse();
							}
						}
					}

					// functions for close command
					if (
						message.content.includes(config.command_close) ||
						message.content.includes(config.command_sc_close)
					) {
						// collect tags and add close tag
						let initialTags = [closeTag[0].id, ...postTags];
						let tags = [...new Set(initialTags)];

						// send embed message upon executing the close command
						await message.channel.send({
							embeds: [sendEmbedMessage(`${config.reminder_close}`)],
							content: `🔔 <@${message.channel.ownerId}>`,
						});

						// then archive / close it
						message.channel.edit({
							appliedTags: tags,
							archived: true,
						});

						// check if there's a mentioned user
						if (mention.users.first()) {
							// send the data, use the mentioned user as resolvedBy
							sendData(
								{
									post_id: postId,
									close_time: statusTime,
									closed_by: mention.users.first().username,
								},
								config.datasheet_close
							);

							if (message.content.includes("!sf")) {
								sendFirstResponse();
							}
						} else {
							// send the data with the one who sends the command
							sendData(
								{
									post_id: postId,
									close_time: statusTime,
									closed_by: statusBy,
								},
								config.datasheet_close
							);

							if (message.content.includes("!sf")) {
								sendFirstResponse();
							}
						}
					}

					// functions for the end command
					else if (message.content.includes(config.command_end)) {
						// collect tags and add close tag
						let initialTags = [closeTag[0].id, ...postTags];
						let tags = [...new Set(initialTags)];

						// then archive / close it
						message.channel.edit({
							appliedTags: tags,
							archived: true,
						});

						// check if there's a mentioned user
						if (mention.users.first()) {
							// send the data, use the mentioned user as resolvedBy
							sendData(
								{
									post_id: postId,
									close_time: statusTime,
									closed_by: mention.users.first().username,
								},
								config.datasheet_close
							);
						} else {
							// send the data with the one who sends the command
							sendData(
								{
									post_id: postId,
									close_time: statusTime,
									closed_by: statusBy,
								},
								config.datasheet_close
							);
						}
					}

					// functions for escalation command
					if (
						message.content.includes(config.command_escalate) ||
						(message.content.includes(config.command_sc_escalate) &&
							getURLFromMessage(message.content) &&
							getURLFromMessage(message.content).length)
					) {
						// collect tags and add escalation tag
						let initialTags = [escalateTag[0].id, ...postTags];
						let tags = [...new Set(initialTags)];
						const escalationLink = getURLFromMessage(message.content);

						// send embed message upon executing the escalate command
						await message.channel.send({
							embeds: [sendEmbedMessage(`${config.reminder_escalate}`)],
							content: `🔔 <@${message.channel.ownerId}>`,
						});

						// then update the tags
						message.channel.edit({
							appliedTags: tags,
						});

						// check if there's a mentioned user
						if (mention.users.first()) {
							// send the data, use the mentioned user as resolvedBy
							sendData(
								{
									post_id: postId,
									escalation_time: statusTime,
									escalated_by: mention.users.first().username,
									escalation_link: escalationLink[0],
								},
								config.datasheet_escalate
							);
						} else {
							// send the data with the one who sends the command
							sendData(
								{
									post_id: postId,
									escalation_time: statusTime,
									escalated_by: statusBy,
									escalation_link: escalationLink[0],
								},
								config.datasheet_escalate
							);
						}
					}

					// functions for bug command
					if (message.content.includes(config.command_bug)) {
						// collect tags and add bug tag
						let initialTags = [bugTag[0].id, ...postTags];
						let tags = [...new Set(initialTags)];

						// then update the tags
						message.channel.edit({
							appliedTags: tags,
						});

						// send the data with the one who sends the command
						sendData(
							{
								post_id: postId,
								status_time: statusTime,
								status_by: statusBy,
							},
							config.datasheet_bug
						);
					}

					// functions for email command (temporary command)
					if (
						message.content.includes("email") ||
						message.content.includes("mitigation")
					) {
						// embed message about the mitigation
						const emailMessage = new EmbedBuilder()
							.setDescription(
								"**REMINDER** ⚠️\nTo best protect you and our users, we ask that all specific questions and troubleshooting related to the mitigation is directed to `support@thirdweb.com`. \n\nWe're closing this thread for now, but please feel free to reach out to us via email if you have any questions or concerns."
							)
							.setColor(`#f213a4`);

						// send embed message saying to proceed in email
						await message.channel.send({
							embeds: [emailMessage],
						});

						// and send it
						sendData(
							{
								post_id: postId,
								first_response: statusTime,
								responder: statusBy,
							},
							config.datasheet_response
						);
					}

					// functions for account/billing issues command (temporary command)
					if (message.content.includes("billing")) {
						// embed message about the account/billing issues
						const billingMessage = new EmbedBuilder()
							.setDescription(
								"**REMINDER** ⚠️\nThis is a public channel to best protect you, we ask that all specific questions and troubleshooting related to your account or billing please send us an email to `support@thirdweb.com`. \n\nWe're closing this thread for now, but please feel free to reach out to us via email if you have any questions or concerns."
							)
							.setColor(`#f213a4`);

						// send embed message saying to proceed in email
						await message.channel.send({
							embeds: [billingMessage],
						});

						// and send it
						sendData(
							{
								post_id: postId,
								first_response: statusTime,
								responder: statusBy,
							},
							config.datasheet_response
						);
					}
				} else {
					message.channel
						.send({
							embeds: [sendEmbedMessage(`${config.reminder_max_tags}`)],
							content: `🔔 <@${message.author.id}>`,
						})
						.then((message) => {
							setTimeout(() => message.delete(), 10000); // delete message after 15s
						});
				}
			}
		}

		/**
		 * Logic to capture the first response from the forum post
		 */
		// check the the message if it is in the thread and from the support role
		if (
			message.channel.type === ChannelType.PublicThread &&
			member.roles.cache.hasAny(...roleIDs) &&
			!message.content.startsWith(config.command_prefix)
		) {
			// get details about the thread and the message
			const postId = message.channel.id;
			const fetchMessages = await message.channel.messages.fetch({
				after: postId,
			});
			const fetchMessagesArray = Array.from(fetchMessages); // convert the fetch data to array
			// check if the fetch message array is empty
			if (fetchMessagesArray.length) {
				// check the messages for the first messages from the support role
				for (let i = fetchMessagesArray.length - 1; i < i >= 0; i--) {
					// get the member details from the author id in the data from the messages
					const member = await message.guild.members.fetch(
						fetchMessagesArray[i][1].author.id
					);

					// check each messages for mod message, then break it if found the first message from support role
					if (member.roles.cache.hasAny(...roleIDs)) {
						// check if the current message is first message inside the thread from support role
						if (message.id === fetchMessagesArray[i][0] || message.content.startsWith("###fixres")) {

							// delete the message if it is a command to fix the first response
							if (message.content.startsWith("###fixres")) {
								message.delete();
							}

							// capture the date and time
							const firstResponse = formatTime(
								fetchMessagesArray[i][1].createdTimestamp
							);
							const firstResponder = fetchMessagesArray[i][1].author.username;

							// and send it
							sendData(
								{
									post_id: postId,
									first_response: firstResponse,
									responder: firstResponder,
								},
								config.datasheet_response
							);

							// log if the first response has been sent
							console.log(
								`[${serverTime()}][response]: first response sent to database with post id of ${postId}`
							);
						}

						// stop the loop
						break;
					}
				}
			}

			// track the URLs being sent in the threads
			const redirectData = config.redirect_tracking;
			const redirectUrls = config.redirect_tracking.map((data) => data.url);
			if (redirectUrls.some((url) => message.content.includes(url))) {
				// capture and prepare the data
				const urls = await getURLFromMessage(message.content);
				const postId = message.channel.id;
				const redirectTime = formatTime(message.createdTimestamp);
				const redirectBy = message.author.username;
				const sendUrls = [];

				urls.map((url) => {
					// extract the URL only
					const urlOnly = new URL(url).hostname;
					redirectData.map((data) => {
						// get the name of URL for categorization
						if (urlOnly == data.url) {
							sendUrls.push({
								post_id: postId,
								redirect_time: redirectTime,
								redirect_by: redirectBy,
								redirect_url: url,
								redirect_name: data.name,
							});
						}
					});
				});

				// send data in batch in rows
				sendData(sendUrls, config.datasheet_redirect);
			}
		}
	}

	// check if the message has mentioned a team member
	if (mention.users.first()) {
		let mentioned = message.guild.members.cache.get(mention.users.first().id)
		if (mentioned.roles.cache.hasAny(...roleIDs)) {
			message.reply({
				embeds: [sendEmbedMessage(`We have move to a community driven discord support model.\n\nYou can ask me all things thirdweb in the <#${ASKAI_CHANNEL}> channel. Use the command \`!askai\` or \`!ask\` followed by your question to get started.`)],
			});
		}
	}

});

// listen to new forum posts
client.on("threadCreate", async (post) => {
	// get the forum details, from posts to tags
	const forumChannel = client.guilds.cache.get(post.guildId);
	const forumPost = forumChannel.channels.cache.get(post.parentId);
	let forumTags = [];

	// get the post tags
	for (const availableTags of forumPost.availableTags) {
		for (const appliedTags of post.appliedTags) {
			if (availableTags.id === appliedTags) {
				forumTags.push(availableTags.name);
			}
		}
	}

	// gather data
	const messageTimestamp = post.createdTimestamp;
	const postId = post.id;
	const postLink = `https://discord.com/channels/${post.guildId}/${postId}`;
	const question = post.name;
	const postedBy = (await client.users.fetch(post.ownerId)).username;
	const posted = formatTime(messageTimestamp);
	const tags = forumTags.join(", ");
	const firstResponse = `=IFERROR(VLOOKUP(A2:A,${config.datasheet_response}!A2:B,2,0))`;
	const resolutionTime = `=IFERROR(VLOOKUP(A2:A,${config.datasheet_resolve}!A2:B,2,0))`;
	const closeTime = `=IFERROR(VLOOKUP(A2:A,${config.datasheet_close}!A2:B,2,0))`;
	const escalationTime = `=IFERROR(VLOOKUP(A2:A,${config.datasheet_escalate}!A2:B,2,0))`;
	const bugTime = `=IFERROR(VLOOKUP(A2:A,${config.datasheet_bug}!A2:B,2,0))`;
	const responder = `=IFERROR(VLOOKUP(A2:A,{${config.datasheet_response}!A2:A,${config.datasheet_response}!C2:C},2,0))`;
	const resolvedBy = `=IFERROR(VLOOKUP(A2:A,{${config.datasheet_resolve}!A2:A,${config.datasheet_resolve}!C2:C},2,0))`;
	const closedBy = `=IFERROR(VLOOKUP(A2:A,{${config.datasheet_close}!A2:A,${config.datasheet_close}!C2:C},2,0))`;
	const escalatedBy = `=IFERROR(VLOOKUP(A2:A,{${config.datasheet_escalate}!A2:A,${config.datasheet_escalate}!C2:C},2,0))`;
	const escalationLink = `=IFERROR(VLOOKUP(A2:A,{${config.datasheet_escalate}!A2:A,${config.datasheet_escalate}!D2:D},2,0))`;
	const bugBy = `=IFERROR(VLOOKUP(A2:A,{${config.datasheet_bug}!A2:A,${config.datasheet_bug}!C2:C},2,0))`;

	// send the data
	sendData(
		{
			post_id: postId,
			post_link: postLink,
			question: question,
			posted_by: postedBy,
			posted: posted,
			tags: tags,
			responder: responder,
			first_response: firstResponse,
			resolution_time: resolutionTime,
			resolved_by: resolvedBy,
			close_time: closeTime,
			closed_by: closedBy,
			escalation_time: escalationTime,
			escalated_by: escalatedBy,
			escalation_link: escalationLink,
			bug_time: bugTime,
			bug_by: bugBy,
		},
		config.datasheet_init
	);

	// send message upon creating of new ticket
	post.send({
		embeds: [sendEmbedMessage(config.reminder_newpost)],
		components: [CloseButtonComponent()],
	});

	// log any new posts
	console.log(
		`[${serverTime()}][new]: new post detected with post id of ${postId}`
	);
	// try to generate an ai response for the post
	let aiMessageLoading = await post.send({
		embeds: [
			sendEmbedMessage("**RESPONSE:** " + `<a:load:1210497921158619136>`),
		],
	});

	await context.query({
		botId: CONTEXT_ID,
		query: question,
		onComplete: async (query) => {
			
			await post.messages.fetch(aiMessageLoading.id).then((msg) =>
				msg.edit({
					content: "",
					embeds: [
						sendEmbedMessage("**RESPONSE:** " + query.output.toString()),
					],
					components: [FeedbackButtonComponent()],
				})
			);
			
		},
		onError: (error) => {
			console.error(error);
		},
	});
});

//listen to button clicks
client.on("interactionCreate", async (interaction) => {
	if (interaction.isButton()) {
		const forum = client.guilds.cache.get(interaction.guild.id);
		const post = forum.channels.cache.get(interaction.channel.parent.id);
		const postedBy = (await client.users.fetch(interaction.channel.ownerId))
			.username;
		const postTags = interaction.channel.appliedTags;
		const statusTime = formatTime(interaction.createdTimestamp);
		const closeTag = post.availableTags.filter((item) => {
			return item.name == config.tag_name_close;
		});
		let initialTags = [closeTag[0].id, ...postTags];
		let tags = [...new Set(initialTags)];
		const question = post.name;
		if (interaction.channel.ownerId != interaction.user.id) return;
		if (interaction.customId === "close") {
			// send embed message upon executing the close command
			await interaction.channel.send({
				embeds: [sendEmbedMessage(`${config.reminder_close}`)],
				content: `🔔 <@${interaction.channel.ownerId}>`,
			});
			await interaction.message.edit({ components: [] });
			// then archive / close it
			interaction.channel.edit({
				appliedTags: tags,
				archived: true,
			});

			sendData(
				{
					post_id: interaction.channel.id,
					close_time: statusTime,
					closed_by: postedBy,
				},
				config.datasheet_close
			);
		} else if (interaction.customId === "helpful") {
			// console.log(question)
			sendData(
				{
					post_id: interaction.channel.id,
					feedback: true,
				},
				config.datasheet_feedback
			);

			await interaction.reply({
				embeds: [sendEmbedMessage(`Thank you so much for your feedback!`)],
				content: `🔔 <@${interaction.channel.ownerId}>`,
				ephemeral: true,
			});
			await interaction.message.edit({ components: [] });
		} else if (interaction.customId === "not-helpful") {
			sendData(
				{
					post_id: post.id,
					feedback: false,
				},
				config.datasheet_feedback
			);
			await interaction.reply({
				embeds: [sendEmbedMessage(`Thank you so much for your feedback!`)],
				content: `🔔 <@${interaction.channel.ownerId}>`,
				ephemeral: true,
			});
			await interaction.message.edit({ components: [] });
		}
	}
});

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

// log in to Discord with your client's token
client.login(token);
