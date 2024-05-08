const fs = require("fs");
const path = require("node:path");
const {
	Client,
	GatewayIntentBits,
	Partials,
} = require("discord.js");
const {
	serverTime,
} = require("./utils/core");

// usecontext.ai imports
const { ContextSDK } = require("@context-labs/sdk");
const Redis = require("ioredis");

require("dotenv").config();

// discord bot tokens
const {
	DISCORD_BOT_TOKEN,
	DISCORD_SUPPORT_ROLE_ID,
	REDIS_SERVER_URL
} = process.env;

const token = DISCORD_BOT_TOKEN;
const roleIDs = DISCORD_SUPPORT_ROLE_ID.split(",");

// discord bot instents and partials
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
	],
	partials: [Partials.Channel, Partials.Message],
});
const redis = new Redis(REDIS_SERVER_URL);
//create context instance
const context = new ContextSDK({});

// listen to post messages
// client.on("messageCreate", async (message) => {

// });

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

//  check if the Redis is ready then log in the bot to Discord
redis.on("ready", () => {
  console.log(`[${serverTime()}][log]: Redis is ready!`);

	// log in to Discord with your client's token
	client.login(token);
});
