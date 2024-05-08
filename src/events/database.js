const Redis = require("ioredis");
const { serverTime } = require('../utils/core');

const { REDIS_SERVER_URL } = process.env;

const redis = new Redis(REDIS_SERVER_URL);

// log connection
redis.on("connect", () => {
  console.log(`[${serverTime()}][log]: Successfully connected to Redis!`);
});
redis.on("reconnecting", () =>{
  console.log(`[${serverTime()}][log]: Reconnecting to Redis...`);
});
redis.on("error", (err) => () => {
  console.log(`[${serverTime()}][error]: Redis Error: ${err}`);
});

module.exports = redis;