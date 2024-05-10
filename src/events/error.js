const { Events } = require('discord.js');

module.exports = {
    name: Events.Error,
    once: false,
    execute(error) {
        console.log(`[${serverTime()}][ERROR]: ${error}`);
    },
};