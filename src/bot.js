const fs = require("fs");
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
} = require("./utils/core");
const { sendData } = require("./utils/database");

require("dotenv").config();

// discord bot tokens
const { DISCORD_BOT_TOKEN, DISCORD_SUPPORT_ROLE_ID } = process.env;

const token = DISCORD_BOT_TOKEN;
const roleIDs = DISCORD_SUPPORT_ROLE_ID.split(",");

// discord bot intents and partials
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
	],
	partials: [Partials.Channel, Partials.Message],
});

// listen to post messages
client.on("messageCreate", async (message) => {
	const { content, author, member, mention, channel, guild, mentions } =
		message;
	if (author.bot) return;

	// check ping
	if (content === "ping") {
		message.reply({ embeds: [sendEmbedMessage(`Pong: ${client.ws.ping}ms`)] });
		console.info(`[log]: responded to ping command in ${client.ws.ping}ms`);
		return;
	}

	// respond to user if the bot mentioned specifically not with everyone
	if (mentions.has(client.user) && !mentions.everyone) {
		// convert this to embed message.reply({config.mention_message);
		message.reply({ embeds: [sendEmbedMessage(config.reminder_mention)] });
	}

	// get the forum details, from posts to tags
	const forum = client.guilds.cache.get(guild.id);
	const post = forum.channels.cache.get(channel.parent.id);

	// check if the message is from the forum post
	if (typeof post.availableTags === "undefined") return;

	// filter the tags to get the resolution tag name ID
	const resolutionTag = [];
	const closeTag = [];
	const escalateTag = [];
	const bugTag = [];

	for (let i = 0; i < post.availableTags.length; i++) {
		const item = post.availableTags[i];
		switch (item.name) {
			case config.tag_name_resolve:
				resolutionTag.push(item);
				break;
			case config.tag_name_close:
				closeTag.push(item);
				break;
			case config.tag_name_escalate:
				escalateTag, push(item);
				break;
			case config.tag_name_bug:
				bugTag.push(item);
				break;
			default:
				break;
		}
	}

	// get the existing tags of the post
	const postTags = channel.appliedTags;
	const hasAnyRoleIds = member.roles.cache.hasAny(...roleIDs);
	// check if the message has the command prefix
	if (content.startsWith(config.command_prefix)) {
		console.info(`Command detected: ${content}. Deleting message`);
		message.delete(); // delete the command message for better visuals (no need to await this)

		// check if the message is in the forum post and from the support role
		if (channel.type !== ChannelType.PublicThread || !hasAnyRoleIds) {
			console.error(
				"Check failed: channel.type !== ChannelType.PublicThread || !hasAnyRoleIds"
			);
			return;
		}

		// Only allow a post to have maximum 5 tags
		if (postTags.length >= 5) {
			channel
				.send({
					embeds: [sendEmbedMessage(`${config.reminder_max_tags}`)],
					content: `🔔 <@${message.author.id}>`,
				})
				.then((message) => {
					setTimeout(() => message.delete(), 10000); // delete message after 15s
				});
			return;
		}

		// gather data
		const postId = channel.id;
		const statusTime = formatTime(message.createdTimestamp);
		const statusBy = member.user.username;
		const userTag =
			mention && mention.users.first()?.username
				? mention.users.first().username
				: statusBy;
		// functions for resolve command
		if (
			content.includes(config.command_resolve) ||
			content.includes(config.command_sc_resolve)
		) {
			// collect tags and add resolve tag
			let initialTags = [resolutionTag[0].id, ...postTags].filter(
				(item) => item != escalateTag[0].id
			);
			let tags = [...new Set(initialTags)];

			// send embed message upon executing the resolve command
			await channel.send({
				embeds: [sendEmbedMessage(`${config.reminder_resolve}`)],
				content: `🔔 <@${channel.ownerId}>`,
			});

			// then archive / close it
			channel.edit({
				appliedTags: tags,
				archived: true,
			});
			sendData(
				{
					post_id: postId,
					resolution_time: statusTime,
					resolved_by: userTag,
				},
				config.datasheet_resolve
			);
		}

		// functions for close command
		else if (
			content.includes(config.command_close) ||
			content.includes(config.command_sc_close)
		) {
			// collect tags and add close tag
			const initialTags = [closeTag[0].id, ...postTags];
			const tags = [...new Set(initialTags)];

			// send embed message upon executing the close command
			await channel.send({
				embeds: [sendEmbedMessage(`${config.reminder_close}`)],
				content: `🔔 <@${channel.ownerId}>`,
			});

			// then archive / close it
			channel.edit({
				appliedTags: tags,
				archived: true,
			});
			sendData(
				{
					post_id: postId,
					close_time: statusTime,
					closed_by: userTag,
				},
				config.datasheet_close
			);
		}

		// functions for escalation command
		else if (
			content.includes(config.command_escalate) ||
			(content.includes(config.command_sc_escalate) &&
				getURLFromMessage(content) &&
				getURLFromMessage(content).length)
		) {
			// collect tags and add escalation tag
			const initialTags = [escalateTag[0].id, ...postTags];
			const tags = [...new Set(initialTags)];
			const escalationLink = getURLFromMessage(content);

			// send embed message upon executing the escalate command
			await channel.send({
				embeds: [sendEmbedMessage(`${config.reminder_escalate}`)],
				content: `🔔 <@${channel.ownerId}>`,
			});

			// then update the tags
			channel.edit({
				appliedTags: tags,
			});

			sendData(
				{
					post_id: postId,
					escalation_time: statusTime,
					escalated_by: userTag,
					escalation_link: escalationLink[0],
				},
				config.datasheet_escalate
			);
		}

		// functions for bug command
		else if (content.includes(config.command_bug)) {
			// collect tags and add bug tag
			const initialTags = [bugTag[0].id, ...postTags];
			const tags = [...new Set(initialTags)];

			// then update the tags
			channel.edit({
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
	}

	/**
	 * Logic to capture the first response from the forum post
	 */
	// check the the message if it is in the thread and from the support role
	else if (channel.type === ChannelType.PublicThread && hasAnyRoleIds) {
		// get details about the thread and the message
		const postId = channel.id;
		const fetchMessages = await channel.messages.fetch({ after: postId });
		const fetchMessagesArray = Array.from(fetchMessages); // convert the fetch data to array
		// check if the fetch message array is empty
		if (!fetchMessagesArray.length) return;
		// check the messages for the first messages from the support role
		for (let i = fetchMessagesArray.length - 1; i >= 0; i--) {
			// get the member details from the author id in the data from the messages
			const _member = await guild.members.fetch(
				fetchMessagesArray[i][1].author.id
			);

			// check each messages for mod message, then break it if found the first message from support role
			if (_member.roles.cache.hasAny(...roleIDs)) {
				// check if the current message is first message inside the thread from support role
				if (
					message.id === fetchMessagesArray[i][0] &&
					content.includes("fixresponse")
				) {
					// capture the date and time
					const firstResponse = formatTime(
						fetchMessagesArray[i][1].createdTimestamp
					);
					const firstResponder = fetchMessagesArray[i][1].author.username;
					sendData(
						{
							post_id: postId,
							first_response: firstResponse,
							responder: firstResponder,
						},
						config.datasheet_response
					);
					// log if the first response has been sent
					console.info(
						`[log]: first response sent to database with post id of ${postId}`
					);
				}
				break;
			}
		}
	}
});

// listen to new forum posts
client.on("threadCreate", async (post) => {
	// get the forum details, from posts to tags
	const forumChannel = client.guilds.cache.get(post.guildId);
	const forumPost = forumChannel.channels.cache.get(post.parentId);
	const forumTags = [];

	// Send message
	const allowedChannels = []; // Only respond in appropriate channels
	if (true) {
		post.send(
			"Thanks for reaching out. Please take a look at this docs <link> to learn how to provide a better context so that you can help us help you"
		);
	}

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
