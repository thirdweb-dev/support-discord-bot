const { Events } = require("discord.js");
const { serverTime } = require("../utils/core");

module.exports = {
    name: Events.Error,
    once: false,
    execute(error) {
        console.log(`[${serverTime()}][ERROR]: ${error}`);
    },
};