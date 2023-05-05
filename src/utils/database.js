const config = require('../config.json');
const { GoogleSpreadsheet } = require('google-spreadsheet');
require('dotenv').config();

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

	// check if the data will be send to init sheet
	if (datasheet === config.datasheet_init) {
		await sheet.addRow(data);
	};

	// check if the data will be send to response sheet
	if (datasheet === config.datasheet_response) {
		await sheet.addRow(data);
	}

	// check if the data will be send to resolve sheet
	if (datasheet === config.datasheet_resolve) {
		await sheet.addRow(data);
	};
}

module.exports = {
    sendData
}