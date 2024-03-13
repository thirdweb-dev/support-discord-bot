const { Events, ActivityType } = require('discord.js');
const { serverTime } = require('../utils/core');
const packageJSON = require('../../package.json');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(bot) {
        bot.user?.setPresence({
            activities: [{
                name: `for assistance.`,
                type: ActivityType.Watching
            }]
            
        });

        console.log(`[${serverTime()}][online]: logged in as ${bot.user.tag} @ v${packageJSON.version}`);
    },
};