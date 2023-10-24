const { EmbedBuilder } = require("discord.js");
const config = require("../config.json");

/**
 * send embed message
 * @param {string} message
 * @returns pre-defined embed style
 */
const sendEmbedMessage = (message) => {
  return new EmbedBuilder().setDescription(message).setColor(`#f213a4`);
};

/**
 * format time according to UTC
 * @param {string} date - epoch timestamp
 * @returns time and date format
 */
const formatTime = (date) => {
  const utcOffset = config.utc_offset;
  const utcDate = new Date(date);
  const options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: `Etc/GMT${utcOffset >= 0 ? "+" : ""}${utcOffset}`,
  };
  const formattedDate = new Intl.DateTimeFormat("en-US", options).format(
    utcDate
  );

  return formattedDate.replace(/\//g, "/");
};

/**
 * get username from ownerid/author.id
 * @param {number} id user's id
 * @returns
 */
const getUsernameFromId = async (id) => {
  return (await client.users.fetch(id)).username;
};

const getURLFromMessage = (message) => {
  const regex = /(https?:\/\/[^\s]+)/g;
  const url = message.match(regex);
  return url;
};

module.exports = {
  sendEmbedMessage,
  formatTime,
  getUsernameFromId,
  getURLFromMessage,
};
