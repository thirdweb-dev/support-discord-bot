const fs = require("fs");
const path = require("node:path");
const {
	Client, 
	ChannelType, 
	GatewayIntentBits, 
	Partials } = require("discord.js");
const config = require("./config.json");
const { sendEmbedMessage, formatTime, getURLFromMessage } = require("./utils/core");
const { sendData } = require("./utils/database");

require("dotenv").config();

// discord bot tokens
const { 
	DISCORD_BOT_TOKEN,
	DISCORD_SUPPORT_ROLE_ID
} = process.env;

const token = DISCORD_BOT_TOKEN;
const roleIDs = DISCORD_SUPPORT_ROLE_ID.split(',');

// discord bot instents and partials
const client = new Client({ 
	intents: [
		GatewayIntentBits.Guilds, 
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages
	],
	partials: [
		Partials.Channel,
		Partials.Message
	]
});

// listen to post messages
client.on('messageCreate', async (message) => {
	if (message.author.bot) return;
	
	// check ping
	if (message.content === 'ping') {

		message.reply({ embeds: [
			sendEmbedMessage(`Pong: ${client.ws.ping}ms`)
		] });
		console.log(`[log]: responded to ping command in ${client.ws.ping}ms`);
	}

	// respond to user if the bot mentioned specifically not with everyone
	if (message.mentions.has(client.user) && !message.mentions.everyone) {
		// convert this to embed message.reply({config.mention_message);
		message.reply({ embeds: [
			sendEmbedMessage(config.reminder_mention)
		] });
	}

	// get the details from user who send command
	const member = message.member;
	const mention = message.mentions;

	// get the forum details, from posts to tags
	const forum = client.guilds.cache.get(message.guild.id);
	const post = forum.channels.cache.get(message.channel.parent.id);

	// check if the message is from the forum post
	if (typeof post.availableTags !== 'undefined') {
		// filter the tags to get the resolution tag name ID
		const resolutionTag = post.availableTags.filter((item) => { return item.name == config.tag_name_resolve });
		const closeTag = post.availableTags.filter((item) => { return item.name == config.tag_name_close });
		const escalateTag = post.availableTags.filter((item) => { return item.name == config.tag_name_escalate });
		const bugTag = post.availableTags.filter((item) => { return item.name == config.tag_name_bug });
		// get the existing tags of the post
		const postTags = message.channel.appliedTags;

		// check if the message has the command prefix
		if (message.content.startsWith(config.command_prefix)) {
			await message.delete(); // delete the commmand message
			
			// check if the message is in the forum post and from the support role
			if (message.channel.type === ChannelType.PublicThread && member.roles.cache.hasAny(...roleIDs)) {

				// check if the post has fewer tags
				if (postTags.length < 5) {

					// gather data
					const postId = message.channel.id;
					const statusTime = formatTime(message.createdTimestamp);
					const statusBy = member.user.username;

					// functions for resolve command
					if (message.content == config.command_prefix + config.command_resolve || message.content == config.command_prefix + config.command_sc_resolve) {
						// collect tags and add resolve tag
						let initialTags = [resolutionTag[0].id,...postTags].filter((item) => { 
							return item != escalateTag[0].id 
						});
						let tags = [...new Set(initialTags)];

						// send embed message upon executing the resolve command
						await message.channel.send({ 
							embeds: [
								sendEmbedMessage(`${config.reminder_resolve}`)
							],
							content: `🔔 <@${message.channel.ownerId}>`
						});

						// then archive / close it
						message.channel.edit({
							appliedTags: tags,
							archived: false
						});

						// check if there's a mentioned user
						if (mention.users.first()) {
							// send the data, use the mentioned user as resolvedBy
							sendData({
								post_id: postId,
								resolution_time: statusTime,
								resolved_by: mention.users.first().username,
							}, config.datasheet_resolve);
						} else {
							// send the data with the one who sends the command
							sendData({
								post_id: postId,
								resolution_time: statusTime,
								resolved_by: statusBy,
							}, config.datasheet_resolve);
						}

					}

					// functions for fix resolve command (this will send the data again to the database)
					if (message.content == config.command_prefix + config.command_fix_prefix + config.command_resolve) {
						// check if there's a mentioned user
						if (mention.users.first()) {
							// send the data, use the mentioned user as resolvedBy
							sendData({
								post_id: postId,
								resolution_time: statusTime,
								resolved_by: mention.users.first().username,
							}, config.datasheet_resolve);
						} else {
							// send the data with the one who sends the command
							sendData({
								post_id: postId,
								resolution_time: statusTime,
								resolved_by: statusBy,
							}, config.datasheet_resolve);
						}
					}

					// functions for close command
					if (message.content.includes(config.command_close) || message.content.includes(config.command_sc_close)) {
						// collect tags and add close tag
						let initialTags = [closeTag[0].id,...postTags];
						let tags = [...new Set(initialTags)];

						// send embed message upon executing the close command
						await message.channel.send({ 
							embeds: [
								sendEmbedMessage(`${config.reminder_close}`)
							],
							content: `🔔 <@${message.channel.ownerId}>`
						});

						// then archive / close it
						message.channel.edit({
							appliedTags: tags,
							archived: true
						});

						// check if there's a mentioned user
						if (mention.users.first()) {
							// send the data, use the mentioned user as resolvedBy
							sendData({
								post_id: postId,
								close_time: statusTime,
								closed_by: mention.users.first().username,
							}, config.datasheet_close);
						} else {
							// send the data with the one who sends the command
							sendData({
								post_id: postId,
								close_time: statusTime,
								closed_by: statusBy,
							}, config.datasheet_close);
						}

					}

					else if (message.content.includes(config.command_end)) {
						// collect tags and add close tag
						let initialTags = [closeTag[0].id,...postTags];
						let tags = [...new Set(initialTags)];

						// then archive / close it
						message.channel.edit({
							appliedTags: tags,
							archived: true
						});

						// check if there's a mentioned user
						if (mention.users.first()) {
							// send the data, use the mentioned user as resolvedBy
							sendData({
								post_id: postId,
								close_time: statusTime,
								closed_by: mention.users.first().username,
							}, config.datasheet_close);
						} else {
							// send the data with the one who sends the command
							sendData({
								post_id: postId,
								close_time: statusTime,
								closed_by: statusBy,
							}, config.datasheet_close);
						}
					}

					// functions for escalation command
					if (message.content.includes(config.command_escalate) || message.content.includes(config.command_sc_escalate) && getURLFromMessage(message.content) && getURLFromMessage(message.content).length) {
						// collect tags and add escalation tag
						let initialTags = [escalateTag[0].id,...postTags];
						let tags = [...new Set(initialTags)];
						const escalationLink = getURLFromMessage(message.content);

						// send embed message upon executing the escalate command
						await message.channel.send({
							embeds: [
								sendEmbedMessage(`${config.reminder_escalate}`)
							],
							content: `🔔 <@${message.channel.ownerId}>`
						});

						// then update the tags
						message.channel.edit({
							appliedTags: tags
						});

						// check if there's a mentioned user
						if (mention.users.first()) {
							// send the data, use the mentioned user as resolvedBy
							sendData({
								post_id: postId,
								escalation_time: statusTime,
								escalated_by: mention.users.first().username,
								escalation_link: escalationLink[0],
							}, config.datasheet_escalate);
						} else {
							// send the data with the one who sends the command
							sendData({
								post_id: postId,
								escalation_time: statusTime,
								escalated_by: statusBy,
								escalation_link: escalationLink[0],
							}, config.datasheet_escalate);
						}

					}

					// functions for bug command
					if (message.content.includes(config.command_bug)) {
						// collect tags and add bug tag
						let initialTags = [bugTag[0].id,...postTags];
						let tags = [...new Set(initialTags)];

						// then update the tags
						message.channel.edit({
							appliedTags: tags
						});

						// send the data with the one who sends the command
						sendData({
							post_id: postId,
							status_time: statusTime,
							status_by: statusBy,
						}, config.datasheet_bug);
					}

				} else {
					message.channel.send({
						embeds: [
							sendEmbedMessage(`${config.reminder_max_tags}`)
						],
						content: `🔔 <@${message.author.id}>`
					})
					.then(message => {
						setTimeout(() => message.delete(), 10000) // delete message after 15s
					});
				}
			}
		}

		/**
		 * Logic to capture the first response from the forum post
		 */
		// check the the message if it is in the thread and from the support role
		if (message.channel.type === ChannelType.PublicThread && member.roles.cache.hasAny(...roleIDs) && !message.content.startsWith(config.command_prefix)) {
			// get details about the thread and the message
			const postId = message.channel.id;
			const fetchMessages = await message.channel.messages.fetch({ after: postId });
			const fetchMessagesArray = Array.from(fetchMessages); // convert the fetch data to array
			// check if the fetch message array is empty
			if (fetchMessagesArray.length) {
				// check the messages for the first messages from the support role
				for (let i = fetchMessagesArray.length - 1; i < i >= 0; i--) {

					// get the member details from the author id in the data from the messages
					const member = await message.guild.members.fetch(fetchMessagesArray[i][1].author.id);

					// check each messages for mod message, then break it if found the first message from support role
					if (member.roles.cache.hasAny(...roleIDs)) {
						
						// check if the current message is first message inside the thread from support role
						if (message.id === fetchMessagesArray[i][0] || message.content == `${config.command_fix_prefix}response`) {

							// check if the message is from the fix command, if yes, delete it
							if( message.content.startsWith(config.command_fix_prefix)) {
								await message.delete();
							}

							// capture the date and time
							const firstResponse = formatTime(fetchMessagesArray[i][1].createdTimestamp);
							const firstResponder = fetchMessagesArray[i][1].author.username;

							// and send it
							sendData({
								post_id: postId,
								first_response: firstResponse,
								responder: firstResponder
							}, config.datasheet_response);

							// log if the first response has been sent
							console.log(`[log]: first response sent to database with post id of ${postId}`);
						}

						// stop the loop
						break;
					}
				}
			}

			// track the URLs being sent in the threads
			const redirectData = config.redirect_tracking;
			const redirectUrls = config.redirect_tracking.map(data => data.url);
			if (redirectUrls.some(url => message.content.includes(url))) {
				// capture and prepare the data
				const urls = await getURLFromMessage(message.content);
				const postId = message.channel.id;
				const redirectTime = formatTime(message.createdTimestamp);
				const redirectBy = message.author.username;
				const sendUrls = [];

				urls.map(url => {
					// extract the URL only
					const urlOnly = new URL(url).hostname;
					redirectData.map(data => {
						// get the name of URL for categorization
						if(urlOnly == data.url) {
							sendUrls.push({
								post_id: postId,
								redirect_time: redirectTime,
								redirect_by: redirectBy,
								redirect_url: url,
								redirect_name: data.name
							});
						}
					})
				});

				// send data in batch in rows
				sendData(sendUrls, config.datasheet_redirect);
			}

		}
	}
});

// listen to new forum posts
client.on('threadCreate', async post => {

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
	const tags = forumTags.join(', ');
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
	sendData({
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
		bug_by: bugBy
	}, config.datasheet_init);

	// send message to the post
	post.send({ embeds: [
		sendEmbedMessage(config.reminder_newpost)
	] });
});

// reading events file
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

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
