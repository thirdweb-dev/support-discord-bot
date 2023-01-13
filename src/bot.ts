import { ActivityType, Client, Events, GatewayIntentBits, MessageType } from 'discord.js';
import config from './config.json';
import filters from './filters.json';
import dotenv from 'dotenv';

dotenv.config();

// Discord Bot Tokens
const { 
	DISCORD_BOT_TOKEN,
	SUPPORT_ROLE_ID,
	SUPPORT_MANAGER_USER_ID,
	SUPPORT_CHANNEL_ID,
	SUPPORT_ACTIVITY_ID,
	SUPPORT_LOGS_ID
} = process.env;

const token = DISCORD_BOT_TOKEN;

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

	if (message.content === 'hello' || message.content === 'hi') {
		message.reply('How are you ' + message.author.username + '!');
	}

	for (const words of filters.keywords) {
		if (!message.content.startsWith('?')) {
			if (MessageType.Default && message.content.includes(words) || message.content.endsWith('?')) {
				message.startThread({
					name: '🟢 ' + message.author.username,
					autoArchiveDuration: 60
				});
				break;
			}
		}
	}

	if (MessageType.Reply) {
		console.log('================================');
		console.log('The message is a reply!');
	} else {
		console.log('The message is not a reply!');
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
});

// Listen to Thread Creation
client.on('threadCreate', async (thread, newlyCreated) => {

	// Get the Thread Info
	const threadMessage = await thread.fetchStarterMessage({
		cache: false
	});

	// Send the message to the newly created thread
	await thread.send('Hey, <@' + threadMessage?.author.id + '>! ' + config.support_thread_intro_message);
    
	// Thread Logs
	console.log(`threadCreate: ${thread}`);
	console.log(threadMessage);
});

// Discord Bot Log Event
client.once(Events.ClientReady, bot => {
	client.user?.setPresence({
		activities: [{
			name: 'for suppport!',
			type: ActivityType.Watching
		}]
	})
	console.log(`Ready! Logged in as ${bot.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token);
