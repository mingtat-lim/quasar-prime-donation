import ExcelJS from 'exceljs';
import * as readline from 'readline';
import { ConfigData, ErrorData, RecordData } from './types';

// Extend the Date prototype with a new function
declare global {
    interface Date {
        toISOLocaleString(): string;
    }

    interface Number {
        leftPad(size: number): string;
    }
}

Date.prototype.toISOLocaleString = function () {
    const offset = this.getTimezoneOffset();
    const offsetString = (offset < 0 ? '+' : '-') + Math.floor(Math.abs(offset / 60)).leftPad(2) + ':' + Math.abs(offset % 60).leftPad(2);

    return (
        this.getFullYear() +
        '-' +
        (this.getMonth() + 1).leftPad(2) +
        '-' +
        this.getDate().leftPad(2) +
        'T' +
        this.getHours().leftPad(2) +
        ':' +
        this.getMinutes().leftPad(2) +
        ':' +
        this.getSeconds().leftPad(2) +
        '.' +
        this.getMilliseconds().leftPad(3) +
        offsetString
    );
};

Number.prototype.leftPad = function (size: number) {
    let s = String(this);
    while (s.length < (size || 2)) {
        s = '0' + s;
    }
    return s;
};

export function sgISOTime() {
    const currentDate = new Date();
    // return currentDate.toLocaleString('en-SG', { timeZone: 'Asia/Singapore' });
    return currentDate.toISOLocaleString();
}

export function promptUser(): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve, reject) => {
        rl.question('Please enter Y to proceed, or press Enter to cancel: ', (answer) => {
            if (answer.toUpperCase() === 'Y') {
                // console.warn('Proceeding...');
                resolve();
            } else {
                // console.log('Invalid input. Program terminated.');
                reject(new Error('User cancelled the process.'));
            }
            rl.close();
        });
    });
}

function isValidPhone(input: string): boolean {
    // Regular expression to match exactly 8 digits
    const regex = /^\d{8}$/;

    // Test the input string against the regex
    return regex.test(input);
}

function isValidMoneyValue(input: string): boolean {
    // Regular expression to match valid money amounts
    const regex = /^\d+(\.\d{1,2})?$/;

    // Test the input string against the regex
    return regex.test(input);
}

function isValidGender(input: string): boolean {
    // Convert the input to uppercase and check if it's 'F' or 'M'
    const gender = input.toUpperCase();
    return gender === 'F' || gender === 'M';
}

function isValidChineseName(chineseName: string): boolean {
    // Check if the length of the string is 2, 3, or 4 characters
    return chineseName.length >= 2 && chineseName.length <= 4;
}

function isValidEmail(subEmail: string): boolean {
    const emailRegex: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(subEmail);
}

function isValidSgNumber(sgNumber: string): boolean {
    // const sgNumberRegex: RegExp = /^[A-Za-z]{2}\d{6}$/;
    const sgNumberRegex: RegExp = /^SG\d{6}$/;
    return sgNumberRegex.test(sgNumber);
}

export function formatAmountToMoney(amount: number): string {
    return new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' }).format(amount);
}

export async function readExcelFile(
    filePath: string,
): Promise<{ sheet1Data: RecordData[]; configData: ConfigData; totalAmount: number; totalRecord: number; isErrorFound: boolean; errorMessages: ErrorData[] }> {
    const errorMessages: ErrorData[] = [];

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    // First sheet: Read records
    const sheet1 = workbook.getWorksheet('data'); // assuming the first sheet is the data
    const sheet1Data: RecordData[] = [];

    // Read headers from the first row and skip it
    sheet1?.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        const record: RecordData = {
            fullName: row.getCell(1).value?.toString() || '',
            chineseName: row.getCell(2).value?.toString() || '',
            phoneNo: row.getCell(3).value?.toString() || '',
            amount: parseFloat(row.getCell(4).value?.toString() || '0'),
            gender: row.getCell(5).value?.toString() || '',
        };

        const errorRecord: ErrorData = {
            type: 'data',
            rowNumber: rowNumber,
            data: record,
            message: [],
        };

        // validations
        if (record.fullName === '') {
            errorRecord.message.push('fullName is missing');
        }

        if (record.chineseName.length > 0 && !isValidChineseName(record.chineseName)) {
            errorRecord.message.push('chineseName must be 2, 3 or 4 character long');
        }

        if (!isValidPhone(record.phoneNo)) {
            errorRecord.message.push('phoneNo must be 8 digit long and conststs of number only');
        }

        if (!isValidMoneyValue(record.amount.toString())) {
            errorRecord.message.push('amount must be a valid money value with format 0.00');
        }

        if (!isValidGender(record.gender)) {
            errorRecord.message.push('gender must be "M" or "F"');
        }

        if (errorRecord.message.length > 0) {
            errorMessages.push(errorRecord);
        }

        sheet1Data.push(record);
    });

    // Calculate total amount
    const totalAmount = sheet1Data.reduce((sum, record) => sum + record.amount, 0);
    const totalRecord = sheet1Data.length;

    // Second sheet: Read configuration data (assumed to be a single record)
    const sheet2 = workbook.getWorksheet('config'); // assuming the second sheet is config data
    const configData: ConfigData = {
        sgNumber: sheet2?.getRow(2).getCell(1).value?.toString() || '',
        subName: sheet2?.getRow(2).getCell(2).value?.toString() || '',
        subEmail: sheet2?.getRow(2).getCell(3).value?.toString() || '',
    };

    const errorRecord: ErrorData = {
        type: 'config',
        rowNumber: 2,
        data: configData,
        message: [],
    };

    if (configData.subName === '') {
        errorRecord.message.push('submitter name is missing');
    }

    if (!isValidSgNumber(configData.sgNumber)) {
        errorRecord.message.push('submitter SG Number is invalid');
    }

    if (!isValidEmail(configData.subEmail)) {
        errorRecord.message.push('submitter email address is invalid');
    }

    if (errorRecord.message.length > 0) {
        errorMessages.push(errorRecord);
    }

    return { sheet1Data, configData, totalAmount, totalRecord, isErrorFound: errorMessages.length > 0, errorMessages };
}
