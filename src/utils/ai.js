const { ContextSDK } = require("@context-labs/sdk");
const { context_id } = require("./env");

const context = new ContextSDK({});
const contextID = context_id;

module.exports = { context, contextID };
