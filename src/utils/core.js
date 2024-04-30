const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

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
		.setColor(`#f213a4`)
		.addFields(
			{ name: 'Need Help?', value: 'Submit a ticket here: https://thirdweb.com/support', inline: false}
		)
		.setTimestamp()
		.setFooter({ text: 'thirdweb', iconURL: 'https://ipfs.io/ipfs/QmTWMy6Dw1PDyMxHxNcmDmPE8zqFCQMfD6m2feHVY89zgu/Icon/Favicon-01.png' });

}
/**
 * close buttons
 * @param {string} message 
 * @returns pre-defined embed style
 */
const CloseButtonComponent = () => {	
	const support = new ButtonBuilder()
		.setLabel('Submit a Ticket')
		.setEmoji('💬')
		.setURL('https://thirdweb.com/support')
		.setStyle(ButtonStyle.Link);

	const row = new ActionRowBuilder()
		.addComponents(support);
	return row
}

/**
 * feedback buttons
 * @param {string} message 
 * @returns pre-defined embed style
 */
const FeedbackButtonComponent = () => {
	const helpful = new ButtonBuilder()
		.setCustomId('helpful')
		.setLabel('Helpful')
		.setEmoji('😊')
		.setStyle(ButtonStyle.Secondary);
	const Nothelpful = new ButtonBuilder()
		.setCustomId('not-helpful')
		.setLabel('Not Helpful')
		.setEmoji('😔')
		.setStyle(ButtonStyle.Secondary);

	const row = new ActionRowBuilder()
		.addComponents(helpful, Nothelpful);
	return row
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

const getURLFromMessage = (message) => {
	const regex = /(https?:\/\/[^\s]+)/g;
	const url = message.match(regex);
	return url;
}

const serverTime = () => {
	return moment.utc().utcOffset(config.utc_offset).format('M/DD/YYYY HH:mm:ss');
}

module.exports = {
	sendEmbedMessage,
	CloseButtonComponent,
	FeedbackButtonComponent,
	formatTime,
	getUsernameFromId,
	getURLFromMessage,
	serverTime
}