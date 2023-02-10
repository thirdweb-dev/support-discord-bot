const basePath = process.cwd();
const { ActivityType, Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require(`${basePath}/src/config.json`);
const dotenv = require('dotenv');

dotenv.config();

// discord bot tokens
const { 
	DISCORD_BOT_TOKEN,
	DISCORD_BOT_TOKEN_DEV,
} = process.env;

const token = DISCORD_BOT_TOKEN;

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
client.on('messageCreate', (message) => {
	if (message.author.bot) return;

	// check ping
	if (message.content === 'ping') {
		message.reply(`Pong: ${client.ws.ping}ms`);
	}
});

// listens for any reactions to messages
client.on('messageReactionAdd', async (reaction, user) => {
	// upon reaction check if it is in partial structure
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error('Err: Something went wrong...', error);
			return;
		}
	}
	// get the details from the user who react
	const member = reaction.message.guild.members.cache.get(user.id);
	const emoji = config.emoji;
	let isSupportRole = member._roles.includes(config.support_role_id);
	
	// check if the emoji reaction is from support role
	if (reaction.emoji.name === emoji && isSupportRole ) {
		// create thread and add who reacts
		const thread = await reaction.message.startThread({
			name: reaction.message.author.username,
			autoArchiveDuration: 60
		});
		thread.members.add(user.id);
	}
});

// discord log event
client.once('ready', bot => {
	client.user?.setPresence({
		activities: [{
			name: 'for suppport!',
			type: ActivityType.Watching
		}]
	})
	console.log(`Ready! Logged in as ${bot.user.tag}`);
});

// log in to Discord with your client's token
client.login(token);
