const basePath = process.cwd();
const { ActivityType, Client, ChannelType, GatewayIntentBits, Partials, time } = require('discord.js');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const config = require(`${basePath}/src/config.json`);
const dotenv = require('dotenv');

dotenv.config();

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
	const user = message.guild.members.cache.get(message.author.id);
	
	// check if the command has the prefix and includes "close"
	if (message.content.startsWith(config.command_prefix) && message.content.includes('close')) {

		await message.delete(); // delete the commmand message

		// check if the channel is a thread and has support role
		if (message.channel.type === ChannelType.PublicThread && hasSupportRole(user._roles, roleIDs)) {

			// then archive and lock it
			message.channel.edit({
				archived: true,
				locked: true
			});

			// gather data
			const threadId = message.channel.id;
			const resolutionTime = formatTime(message.createdTimestamp);
			const resolvedBy = user.displayName;

			// send the data
			sendData({
				thread_id: threadId,
				resolution_time: resolutionTime,
				resolved_by: resolvedBy
			}, 'data2');
		}
	}

	// check the the message if it is in the thread and from the support role
	if (message.channel.type === ChannelType.PublicThread && hasSupportRole(user._roles, roleIDs)) {
		// get details about the thread and the message
		const threadId = message.channel.id;
		const fetchMessages = await message.channel.messages.fetch({ after: threadId });
		const fetchMessagesArray = Array.from(fetchMessages); // convert the fetch data to array

		// check the messages for the first messages from the support role
		for (let i = fetchMessagesArray.length - 1; i < i >= 0; i--) {

			// get the member details from the author id in the data from the messages
			const user = message.guild.members.cache.get(fetchMessagesArray[i][1].author.id);

			// check each messages for mod message, then break it if found the first message from support role
			if (hasSupportRole(user._roles, roleIDs)) {
				
				// check if the current message is first message inside the thread from support role
				if (message.id === fetchMessagesArray[i][0]) {

					// capture the date and time
					const firstResponse = formatTime(fetchMessagesArray[i][1].createdTimestamp);

					// and send it
					sendData({
						thread_id: threadId,
						first_response: firstResponse
					}, 'data1');
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
	const member = reaction.message.guild.members.cache.get(user.id);
	const emojiAssign = config.emoji_assign;
	const emojiClose = config.emoji_close;
	
	/**
	 * assign logic from emoji reaction
	 * check if the user is part of the allowed role before creating a thread
	 */
	if (reaction.emoji.name === emojiAssign && hasSupportRole(member._roles, roleIDs)) {
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

			// send the data
			sendData({
				thread_id: threadId,
				thread_name: threadName,
				question: question,
				posted: posted,
				responder: responder
			}, 'init');
		}
	}
	/**
	 * close logic from emoji reaction
	 * check if the user is part of the allowed role before closing a thread
	 */
	if (reaction.emoji.name === emojiClose && hasSupportRole(member._roles, roleIDs)) {
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
			}, 'data2');
		}
	}
});

/**
 * check if user roles id is allowed in the config
 * @param {array} userRoleIds - array of role ids
 * @param {array} supportRoleIds - array of role ids from env variable
 * @returns boolean
 */
const hasSupportRole = (userRoleIds, supportRoleIds) => {
	return userRoleIds.some(id => supportRoleIds.includes(id));
}

/**
 * sends data to the spreadsheet
 * @param {object} data - data being added as row in the spreadsheet
 * @param {string} datasheet - name of sheet where data being sent e.g. init, data1, data2
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
	if (datasheet === 'init') {
		await sheet.addRow(data);
	};

	// check if the data will be send to data1
	if (datasheet === 'data1') {
		await sheet.addRow(data);
	}

	// check if the data will be send to data2
	if (datasheet === 'data2') {
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
