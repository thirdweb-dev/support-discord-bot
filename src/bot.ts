import { Client, Events, GatewayIntentBits, MessageType } from 'discord.js';
import config from './config.json';
import filters from './filters.json';
import dotenv from 'dotenv';

dotenv.config();

// Discord Bot Tokens
const { DISCORD_BOT_TOKEN_DEV } = process.env;
const token = DISCORD_BOT_TOKEN_DEV;

// Discord Bot Instance
const client = new Client({ 
	intents: [
		GatewayIntentBits.Guilds, 
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages
	] 
});

// Listen to Messages
client.on('messageCreate', (message) => {
	if (message.author.bot) return; 

	if (message.content === 'Hello' || message.content === 'Hi') {
		message.reply('How are you ' + message.author.username + '!');
	}

	// text channel = 0
	// thread channel = 11
	for (const words of filters.keywords) {
		if (message.content !== '?') {
			if (message.channel.type == 0 && message.content.endsWith('?') || message.content.includes(words)) {
				// message.startThread({
				// 	name: 'support - ' + message.author.username,
				// 	autoArchiveDuration: 60,
				// 	reason: 'Just a thread',
				// });
				message.reply('Looks like you need a support!');
				break;
			}
		}
	}

	if (MessageType.Reply) {
		console.log('===============');
		console.log('The message is a reply!');
	}

	// if (message.channel.type == 11 ) {
	// 	message.reply('Please wait for our thirdweb staff, we will get back to you shortly');
	// }

	if (config.support_dev_mode) {
		console.log('================================');
		console.log('Author: ' + message.author.username);
		console.log('Message Content: ' + message.content);
		console.log('Channel Type: ' + message.channel.type);
		console.log('Channel ID: ' + message.channelId);
	}
})

// Discord Bot Log Event
client.once(Events.ClientReady, bot => {
	console.log(`Ready! Logged in as ${bot.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token);
