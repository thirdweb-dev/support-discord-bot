const Redis = require("ioredis");
const { serverTime, localMode } = require("./core");
const { redis_server_url } = require("./env");

let redis;

if (!localMode()) {
  redis = new Redis(redis_server_url);

  // log connection
  redis.on("connect", () => {
    console.log(`[${serverTime()}][LOG]: Successfully connected to Redis!`);
  });
  redis.on("reconnecting", () =>{
    console.log(`[${serverTime()}][LOG]: Reconnecting to Redis...`);
  });
  redis.on("error", (err) => () => {
    console.log(`[${serverTime()}][ERROR]: Redis Error: ${err}`);
  });
}

module.exports = redis;
