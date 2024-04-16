const config = require('../config.json');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

// configure the JWT and authenticate
const jwt = new JWT({
	email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
	key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
	scopes: ['https://www.googleapis.com/auth/spreadsheets','https://www.googleapis.com/auth/drive.file'],
});

// load the spreadsheet
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID, jwt);

/**
 * sends data to the spreadsheet
 * @param {object} data - data being added as row in the spreadsheet
 * @param {string} datasheet - name of sheet where data being sent e.g. init, response, resolve
 */
const sendData = async (data, datasheet) => {
	// authenticate
	// await doc.useServiceAccountAuth({
	// 	client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
	// 	private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
	// });
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

	// check if the data will be send to close sheet
	if (datasheet === config.datasheet_close) {
		await sheet.addRow(data);
	};

	// check if the data will be send to escalate sheet
	if (datasheet === config.datasheet_escalate) {
		await sheet.addRow(data);
	};

	// check if the data will be send to bug sheet
	if (datasheet === config.datasheet_bug) {
		await sheet.addRow(data);
	};
	if (datasheet === config.datasheet_feedback) {
		await sheet.addRow(data);
	};

	// check if the data will be send to redirect sheet
	if (datasheet === config.datasheet_redirect) {
		// the data here is being sent in batch (in rows)
		await sheet.addRows(data);
	};
}

module.exports = {
	sendData
}
