import { CustomLogger } from './types.js';
import * as fsx from 'fs';
import { promises as fs } from 'fs';
import { formatAmountToMoney, promptUser, readExcelFile, sgISOTime } from './excel.js';
import { automate } from './browser.js';

const isDebug = false;

const currentDatetime = sgISOTime();
const isoDate = currentDatetime.split('T')[0]; // Extract the date part from the ISO format

const logName = currentDatetime.split('+')[0].replaceAll(':', '-'); // Extract the date part from the ISO format

const logsRootPath = './logs';
const logsFolderPath = `${logsRootPath}/${isoDate}`;
const screenshotPath = `${logsRootPath}/${isoDate}/screenshot`;

const detailsLogs = new CustomLogger(`${logsFolderPath}/${logName.substring(11)}.log`, screenshotPath);

// create logsRoot if not exists
if (!fsx.existsSync(logsRootPath)) {
    fsx.mkdirSync(logsRootPath);
}

if (!fsx.existsSync(logsFolderPath)) {
    fsx.mkdirSync(logsFolderPath);
    if (isDebug) console.log(`Folder '${logsFolderPath}' created.`);
}

if (!fsx.existsSync(screenshotPath)) {
    fsx.mkdirSync(screenshotPath);
    if (isDebug) console.log(`Folder '${screenshotPath}' created.`);
}

// Example usage: Reading an Excel file from the file system
const dataFilePath = './data/data.xlsx'; // Path to the Excel file

(async function () {
    try {
        detailsLogs.logFile('=== Excution Start ===');

        // Check if file exists and then read it
        await fs.access(dataFilePath); // Check if the file exists
        const data = await readExcelFile(dataFilePath);

        if (isDebug) {
            detailsLogs.log('Data from Excel');
            detailsLogs.log(data);
        }
        if (data.errorMessages.length > 0) {
            detailsLogs.logFile('Errors Details:');
            detailsLogs.logFile(data.errorMessages);
            detailsLogs.log('There are errors in the data. Please rectify the errors and rerun the process.');
            detailsLogs.console(`Log File: ${detailsLogs.name}`);

            detailsLogs.logFile('=== Excution End with Errors ===');
        }

        if (!data.isErrorFound) {
            detailsLogs.log(`No of Donors: ${data.sheet1Data.length}`);
            detailsLogs.log(`Total Amount: ${formatAmountToMoney(data.totalAmount)}`);

            // Example usage
            promptUser()
                .then(async () => {
                    // Proceed with the next steps here
                    detailsLogs.console('Proceed to donation execution. Please do not touch the mouse and keyboard.');

                    await automate(data.configData, data.sheet1Data, detailsLogs, isDebug);

                    detailsLogs.logFile('=== Excution End ===');
                    console.warn('Excution Completed');
                })
                .catch((error) => {
                    // Handle the error or terminate the program
                    detailsLogs.log((error as Error).message);
                    // detailsLogs.logFile(error);
                    if ((error as Error).message === 'User cancelled the process.') {
                        detailsLogs.logFile('=== Excution End ===');
                    } else {
                        detailsLogs.logFile('=== Excution End with Errors ===');
                    }
                    console.warn('Excution Completed');

                    // process.exit(1); // Terminate the program
                });
        }
    } catch (error) {
        console.error('Error reading file:', (error as Error).message);
    }
})();
