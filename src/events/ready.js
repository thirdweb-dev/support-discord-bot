const { Events, ActivityType } = require('discord.js');

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

        console.log(`Ready! Logged in as ${bot.user.tag}`);
    },
};