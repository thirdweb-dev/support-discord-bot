import { Client, Events, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

// Discord Bot Tokens
const { DISCORD_BOT_TOKEN_DEV } = process.env;
const token = DISCORD_BOT_TOKEN_DEV;

// Discord Bot Instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Discord Bot Log Event
client.once(Events.ClientReady, bot => {
	console.log(`Ready! Logged in as ${bot.user.tag}`);
});

// Log in to Discord with your client's token
client.login(token);
