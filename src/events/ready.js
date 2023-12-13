const { Events, ActivityType } = require('discord.js');
const { serverTime } = require('../utils/core');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(bot) {
        bot.user?.setPresence({
            activities: [{
                name: 'for support.',
                type: ActivityType.Watching
            }]
        });

        console.log(`[${serverTime()}][online]: logged in as ${bot.user.tag}`);
    },
};