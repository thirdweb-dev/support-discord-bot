const fs = require('node:fs');
const path = require('node:path');
const {
	Client, 
	ChannelType, 
	GatewayIntentBits, 
	Partials,
	EmbedBuilder } = require('discord.js');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const config = require(`${__dirname}/config.json`);
const moment = require('moment');

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

// load spreadsheet
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);

/**
 * send embed message
 * @param {string} message 
 * @returns pre-defined embed style
 */
const sendEmbedMessage = (message) => {
	return new EmbedBuilder()
	.setDescription(message)
	.setColor(`#f213a4`);
}

/**
 * get username from ownerid
 * @param {number} id 
 * @returns 
 */
const getUsernameFromId = async (id) => {
	return (await client.users.fetch(id)).username;
}

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
		// get the existing tags of the post
		const postTags = message.channel.appliedTags;
		
		// collect tags
		let initialTags = [resolutionTag[0].id,...postTags];
		let tags = [...new Set(initialTags)];

		// check if the command has the prefix and includes "close"
		if (message.content.startsWith(config.command_prefix) && message.content.includes(config.command_resolve)) {
			await message.delete(); // delete the commmand message
			
			// check if the message is in the forum post and from the support role
			if (message.channel.type === ChannelType.PublicThread && member.roles.cache.hasAny(...roleIDs)) {

				// check if the post has fewer tags
				if (postTags.length < 5) {

					// send embed message before closing the post
					message.channel.send({ embeds: [
							sendEmbedMessage(`${config.reminder_resolve}`)
						],
						content: `🔔 <@${message.channel.ownerId}>`
					})

					// then archive and lock it
					message.channel.edit({
						appliedTags: tags,
						archived: true
					});

					// gather data
					const postId = message.channel.id;
					const resolutionTime = formatTime(message.createdTimestamp);
					const resolvedBy = member.user.username;

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
		if (message.channel.type === ChannelType.PublicThread && member.roles.cache.hasAny(...roleIDs)) {
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
	const responder = `=IFERROR(VLOOKUP(A2:A,{${config.datasheet_response}!A2:A,${config.datasheet_response}!C2:C},2,0))`;
	const resolvedBy = `=IFERROR(VLOOKUP(A2:A,{${config.datasheet_resolve}!A2:A,${config.datasheet_resolve}!C2:C},2,0))`;

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
		resolved_by: resolvedBy
	}, config.datasheet_init);
});

/**
 * sends data to the spreadsheet
 * @param {object} data - data being added as row in the spreadsheet
 * @param {string} datasheet - name of sheet where data being sent e.g. init, response, resolve
 */
const sendData = async (data, datasheet) => {
	// authenticate
	await doc.useServiceAccountAuth({
		client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
		private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
	});
	// load the "initial" sheet
	await doc.loadInfo();
	const sheet = doc.sheetsByTitle[datasheet];

	// check if the data will be send to init sheet
	if (datasheet === config.datasheet_init) {
		await sheet.addRow(data);
	};

	// check if the data will be send to response sheet
	if (datasheet === config.datasheet_response) {
		await sheet.addRow(data);
	}

	// check if the data will be send to resolve sheet
	if (datasheet === config.datasheet_resolve) {
		await sheet.addRow(data);
	};
}

/**
 * format time according to UTC
 * @param {number} date - epoch timestamp
 * @returns time and date format
 */
const formatTime = (date) => {
	return moment.utc(date).utcOffset(config.utc_offset).format('M/DD/YYYY HH:mm:ss');
}

// reading events file in discord.js
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
