const basePath = process.cwd();
const { ActivityType, Client, GatewayIntentBits, MessageType, Partials } = require('discord.js');
const dotenv = require('dotenv');
const config = require(`${basePath}/src/config.json`);

dotenv.config();

// discord bot tokens
const { 
	DISCORD_BOT_TOKEN,
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

	if (reaction.emoji.name === emoji && isSupportRole ) {
		reaction.message.startThread({
			name: reaction.message.author.username,
			autoArchiveDuration: 60
		});
	}
});

// listen to thread creation
// client.on('threadCreate', async (thread, newlyCreated) => {

// 	// Get the Thread Info
// 	const threadMessage = await thread.fetchStarterMessage({
// 		cache: false
// 	});

// 	// Send the message to the newly created thread
// 	await thread.send('Hey, <@' + threadMessage?.author.id + '>! ' + config.support_thread_intro_message);
    
// 	// Thread Logs
// 	console.log(`threadCreate: ${thread}`);
// 	console.log(threadMessage);
// });

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
