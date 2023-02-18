require('dotenv').config();
const basePath = process.cwd();
const { ActivityType, Client, ChannelType, GatewayIntentBits, Partials, GuildExplicitContentFilter } = require('discord.js');
const config = require(`${basePath}/src/config.json`);

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
		if (message.channel.type === ChannelType.PublicThread && isSupportRole(user._roles, roleIDs)) {
			// then archive and lock it
			message.channel.edit({
				archived: true,
				locked: true
			});
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
	if (reaction.emoji.name === emojiAssign && isSupportRole(member._roles, roleIDs)) {
		// check if the reaction is not from the thread
		if (reaction.message.channel.type !== ChannelType.PublicThread) {
			// create thread and add who reacts
			const thread = await reaction.message.startThread({
				name: reaction.message.author.username,
				autoArchiveDuration: config.auto_archive_duration
			});
			// then add that user to the thread
			thread.members.add(user.id, 'Assigned user to provide support');
		}
	}
	/**
	 * close logic from emoji reaction
	 * check if the user is part of the allowed role before closing a thread
	 */
	if (reaction.emoji.name === emojiClose && isSupportRole) {
		// check if the reaction is from a thread
		if (reaction.message.channel.type === ChannelType.PublicThread) {
			// then archive and lock it
			reaction.message.channel.edit({
				archived: true,
				locked: true
			});
		}
	}
});

// check if user roles id is allowed in the config
const isSupportRole = (userRoleIds, supportRoleIds) => {
	return userRoleIds.some(id => supportRoleIds.includes(id));
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
