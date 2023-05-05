const { EmbedBuilder } = require('discord.js');
const moment = require('moment');
const config = require('../config.json');

/**
 * send embed message
 * @param {string} message 
 * @returns pre-defined embed style
 */
const sendEmbedMessage = (message) => {
	return new EmbedBuilder()
	.setDescription(message)
	.setColor(`#f213a4`);
}

/**
 * format time according to UTC
 * @param {number} date - epoch timestamp
 * @returns time and date format
 */
const formatTime = (date) => {
	return moment.utc(date).utcOffset(config.utc_offset).format('M/DD/YYYY HH:mm:ss');
}

/**
 * get username from ownerid/author.id
 * @param {number} id user's id
 * @returns 
 */
const getUsernameFromId = async (id) => {
	return (await client.users.fetch(id)).username;
}

module.exports = {
    sendEmbedMessage,
    formatTime,
    getUsernameFromId
}