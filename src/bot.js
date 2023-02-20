const { ActivityType, Client, ChannelType, GatewayIntentBits, Partials } = require('discord.js');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const config = require(`${__dirname}/config.json`);

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
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions
	],
	partials: [
		Partials.Channel,
		Partials.Message,
		Partials.Reaction
	]
});

// load spreadsheet
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);

// listen to messages
client.on('messageCreate', async (message) => {
	if (message.author.bot) return;
	
	// check ping
	if (message.content === 'ping') {
		message.reply(`Pong: ${client.ws.ping}ms`);
	}

	// get the details from user who send command
	const member = message.member;
	
	// check if the command has the prefix and includes "close"
	if (message.content.startsWith(config.command_prefix) && message.content.includes('close')) {

		await message.delete(); // delete the commmand message

		// check if the channel is a thread and has support role
		if (message.channel.type === ChannelType.PublicThread && member.roles.cache.hasAny(...roleIDs)) {

			// then archive and lock it
			message.channel.edit({
				archived: true,
				locked: true
			});

			// gather data
			const threadId = message.channel.id;
			const resolutionTime = formatTime(message.createdTimestamp);
			const resolvedBy = member.user.username;

			// send the data
			sendData({
				thread_id: threadId,
				resolution_time: resolutionTime,
				resolved_by: resolvedBy
			}, config.datasheet_resolve);
		}
	}

	// check the the message if it is in the thread and from the support role
	if (message.channel.type === ChannelType.PublicThread && member.roles.cache.hasAny(...roleIDs)) {
		// get details about the thread and the message
		const threadId = message.channel.id;
		const fetchMessages = await message.channel.messages.fetch({ after: threadId });
		const fetchMessagesArray = Array.from(fetchMessages); // convert the fetch data to array

		// check the messages for the first messages from the support role
		for (let i = fetchMessagesArray.length - 1; i < i >= 0; i--) {

			// get the member details from the author id in the data from the messages
			const member = await message.guild.members.fetch(fetchMessagesArray[i][1].author.id);

			// check each messages for mod message, then break it if found the first message from support role
			if (member.roles.cache.hasAny(...roleIDs)) {
				
				// check if the current message is first message inside the thread from support role
				if (message.id === fetchMessagesArray[i][0]) {

					// capture the date and time
					const firstResponse = formatTime(fetchMessagesArray[i][1].createdTimestamp);

					// and send it
					sendData({
						thread_id: threadId,
						first_response: firstResponse
					}, config.datasheet_response);
				}

				// stop the loop
				break;
			}
		}
	}
});

// listens for any reactions to messages
client.on('messageReactionAdd', async (reaction, user) => {
	// upon reaction check if it is in partial structure
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error(error);
			return;
		}
	}
	// get the details from the user who react
	const guild = reaction.message.guild;
	const member = await guild.members.fetch(user.id);
	const emojiAssign = config.emoji_assign;
	const emojiClose = config.emoji_close;
	
	/**
	 * assign logic from emoji reaction
	 * check if the user is part of the allowed role before creating a thread
	 */
	if (reaction.emoji.name === emojiAssign && member.roles.cache.hasAny(...roleIDs)) {
		const threadName = reaction.message.author.username;

		// check if the reaction is not from the thread
		if (reaction.message.channel.type !== ChannelType.PublicThread) {

			// create thread and add who reacts
			const thread = await reaction.message.startThread({
				name: threadName,
				autoArchiveDuration: config.auto_archive_duration
			});

			// then add that user to the thread
			thread.members.add(user.id, 'Assigned user to provide support');

			// gather data
			const messageTimestamp = reaction.message.createdTimestamp;
			const threadId = thread.id;
			const question = reaction.message.content;
			const posted = formatTime(messageTimestamp);
			const responder = user.username;
			const firstResponse = `=IFERROR(VLOOKUP(A2:A,${config.datasheet_response}!A2:B,2,0))`;
			const resolutionTime = `=IFERROR(VLOOKUP(A2:A,${config.datasheet_resolve}!A2:B,2,0))`;
			const resolvedBy = `=IFERROR(VLOOKUP(A2:A,{${config.datasheet_resolve}!A2:A,${config.datasheet_resolve}!C2:C},2,0))`;

			// send the data
			sendData({
				thread_id: threadId,
				thread_name: threadName,
				question: question,
				posted: posted,
				responder: responder,
				first_response: firstResponse,
				resolution_time: resolutionTime,
				resolved_by: resolvedBy
			}, config.datasheet_init);
		}
	}
	/**
	 * close logic from emoji reaction
	 * check if the user is part of the allowed role before closing a thread
	 */
	if (reaction.emoji.name === emojiClose && member.roles.cache.hasAny(...roleIDs)) {
		// check if the reaction is from a thread
		if (reaction.message.channel.type === ChannelType.PublicThread) {

			// then archive and lock it
			reaction.message.channel.edit({
				archived: true,
				locked: true
			});

			// gather data
			const threadId = reaction.message.channel.id;
			const resolutionTime = formatTime(reaction.message.createdTimestamp);

			// send the data
			sendData({
				thread_id: threadId,
				resolution_time: resolutionTime,
				resolved_by: user.username
			}, config.datasheet_resolve);
		}
	}
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
 * format time according to timezone
 * @param {number} date - epoch timestamp
 * @returns time and date format
 */
const formatTime = (date) => {
	return new Date(date).toLocaleString('en-US', { timeZone: config.timezone });
}

// discord log event
client.once('ready', bot => {
	client.user?.setPresence({
		activities: [{
			name: 'for support.',
			type: ActivityType.Watching
		}]
	});

	console.log(`Ready! Logged in as ${bot.user.tag}`);
});

// log in to Discord with your client's token
client.login(token);
