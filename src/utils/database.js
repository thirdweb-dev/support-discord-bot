const config = require("../config.json");
const { GoogleSpreadsheet } = require("google-spreadsheet");
require("dotenv").config();

// load the spreadsheet
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID);

/**
 * sends data to the spreadsheet
 * @param {object} data - data being added as row in the spreadsheet
 * @param {string} datasheet - name of sheet where data being sent e.g. init, response, resolve
 */
const sendData = async (data, datasheet) => {
  // authenticate
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });
  // load the "initial" sheet
  await doc.loadInfo();
  const sheet = doc.sheetsByTitle[datasheet];
  if (
    [
      config.datasheet_init,
      config.datasheet_response,
      config.datasheet_resolve,
      config.datasheet_close,
      config.datasheet_escalate,
      config.datasheet_bug,
    ].includes(datasheet)
  )
    await sheet.addRow(data);
};

module.exports = {
  sendData,
};
