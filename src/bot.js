const fs = require('node:fs');
const path = require('node:path');
const {
	Client, 
	ChannelType, 
	GatewayIntentBits, 
	Partials } = require('discord.js');
const config = require('./config.json');
const { sendEmbedMessage, formatTime } = require('./utils/core');
const { sendData } = require('./utils/database');

require('dotenv').config();

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
		// message.reply(`Pong: ${client.ws.ping}ms`);
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
		// get the existing tags of the post
		const postTags = message.channel.appliedTags;

		// check if the command has the prefix and includes "resolve"
		if (message.content.startsWith(config.command_prefix)) {
			await message.delete(); // delete the commmand message
			
			// check if the message is in the forum post and from the support role
			if (message.channel.type === ChannelType.PublicThread && member.roles.cache.hasAny(...roleIDs)) {

				// check if the post has fewer tags
				if (postTags.length < 5) {

					// gather data
					const postId = message.channel.id;
					const resolutionTime = formatTime(message.createdTimestamp);
					const resolvedBy = member.user.username;

					// functions for resolve command
					if (message.content.includes(config.command_resolve)) {

						// data for resolve command
						// collect tags
						let initialTags = [resolutionTag[0].id,...postTags];
						let tags = [...new Set(initialTags)];

						// send embed message upon executing the resolve command
						await message.channel.send({ 
							embeds: [
								sendEmbedMessage(`${config.reminder_resolve}`)
							],
							content: `🔔 <@${message.channel.ownerId}>`
						});

						// then archive and lock it
						message.channel.edit({
							appliedTags: tags,
							archived: true
						});

						// check if there's a mentioned user
						if (mention.users.first()) {
							// send the data, use the mentioned user as resolvedBy
							sendData({
								post_id: postId,
								resolution_time: resolutionTime,
								resolved_by: mention.users.first().username,
							}, config.datasheet_resolve);
						} else {
							// send the data with the one who sends the command
							sendData({
								post_id: postId,
								resolution_time: resolutionTime,
								resolved_by: resolvedBy
							}, config.datasheet_resolve);
						}

					}

					// functions for close command
					if (message.content.includes(config.command_close)) {

						// data for resolve command
						// collect tags
						let initialTags = [closeTag[0].id,...postTags];
						let tags = [...new Set(initialTags)];

						// send embed message upon executing the close command
						await message.channel.send({ 
							embeds: [
								sendEmbedMessage(`${config.reminder_close}`)
							],
							content: `🔔 <@${message.channel.ownerId}>`
						});

						// then archive and lock it
						message.channel.edit({
							appliedTags: tags,
							archived: true
						});

						// check if there's a mentioned user
						if (mention.users.first()) {
							// send the data, use the mentioned user as resolvedBy
							sendData({
								post_id: postId,
								close_time: resolutionTime,
								closed_by: mention.users.first().username,
							}, config.datasheet_close);
						} else {
							// send the data with the one who sends the command
							sendData({
								post_id: postId,
								close_time: resolutionTime,
								closed_by: resolvedBy
							}, config.datasheet_close);
						}

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
						if (message.id === fetchMessagesArray[i][0] || message.content.startsWith(config.command_prefix) && message.content.includes('fixresponse')) {

							// check if the message is from the command, if yes, delete it
							if( message.content.startsWith(config.command_prefix) && message.content.includes('fixresponse') ) {
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
	const responder = `=IFERROR(VLOOKUP(A2:A,{${config.datasheet_response}!A2:A,${config.datasheet_response}!C2:C},2,0))`;
	const resolvedBy = `=IFERROR(VLOOKUP(A2:A,{${config.datasheet_resolve}!A2:A,${config.datasheet_resolve}!C2:C},2,0))`;
	const closedBy = `=IFERROR(VLOOKUP(A2:A,{${config.datasheet_close}!A2:A,${config.datasheet_close}!C2:C},2,0))`;

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
		closed_by: closedBy
	}, config.datasheet_init);
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
