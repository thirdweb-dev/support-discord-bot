const fs = require("fs");
const path = require("node:path");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { serverTime, localMode, debugMode } = require("./utils/core");
const redis = require("./utils/database");
const { 
	discord_bot_token,
	discord_support_role,
	context_id,
	askai_channels
} = require("./utils/env");
const config = require("./config.json");

// discord bot instents and partials
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
	],
	partials: [Partials.Channel, Partials.Message],
});

/**
 * Don't modify or update the code below.
 * Keep your changes above ^
 */

// reading events file
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
	.readdirSync(eventsPath)
	.filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// check if the bot is in local development mode ignoring redis connection
if (localMode()) {
	// inform the admin about the mode
	console.log(`[${serverTime()}][WARNING]: This bot is in local mode, this means it will not connect to Redis server.`);
	if(debugMode()) {
		console.log(`[${serverTime()}][INFO]: Debug mode enabled!\n======\nDetails Loaded...\n\nDISCORD SUPPORT ROLES: ${discord_support_role}\nDISCORD ASK CHANNELS: ${askai_channels}\nCONTEXT ID: ${context_id}\n\nLOCAL: ${config.local.toString()}\nDEBUG: ${config.debug.toString()}\n======`);
	}
	// log in to Discord with your client's token
	client.login(discord_bot_token);
} else {
	//  check if the Redis is ready then log in the bot to Discord
	redis.on("ready", () => {
		console.log(`[${serverTime()}][LOG]: Redis is ready!`);

		if(debugMode()) {
			console.log(`[${serverTime()}][INFO]: Debug mode enabled!\n======\nDetails Loaded...\n\nDISCORD SUPPORT ROLES: ${discord_support_role}\nDISCORD ASK CHANNELS: ${askai_channels}\nCONTEXT ID: ${context_id}\n\nLOCAL: ${config.local.toString()}\nDEBUG: ${config.debug.toString()}\n======`);
		}
		
		// log in to Discord with your client's token
		client.login(discord_bot_token);
	});
}
