const { ContextSDK } = require("@context-labs/sdk");
const { context_id } = require("./env");

const context = new ContextSDK({});
const contextID = context_id;

const setQueryFeedback = (queryId, helpful) => {
  context.setQueryFeedback({
    queryId: queryId,
		helpful: helpful,
  });
}

module.exports = { context, contextID, setQueryFeedback };
