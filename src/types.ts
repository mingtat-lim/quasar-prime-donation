import * as fs from 'fs';

export interface DonationData {
    fulleName: string;
    chineseName: string;
    phoneNo: string;
    amount: number;
    gender: string;
}

export interface SubmitterData {
    sgNumber: string;
    subName: string;
    subEmail: string;
}

export class CustomLogger {
    private logName: string;
    private logRoot: string;
    private logDevice: fs.WriteStream;

    constructor(logName: string, logRoot: string) {
        this.logName = logName;
        this.logRoot = logRoot;
        this.logDevice = fs.createWriteStream(logName, { flags: 'a' });
    }

    get name() {
        return this.logName;
    }
    get logFolder() {
        return this.logRoot;
    }

    log(message: string | object, ...args: string[]): void {
        this.console(message, ...args);
        this.logFile(message, ...args);
    }

    logFile(message: string | object, ...args: string[]): void {
        // Custom implementation of the new function
        let formatedMessage = `${new Date().toISOLocaleString()} ${typeof message === 'string' ? message : JSON.stringify(message, null, 4)}`;

        args.forEach((msg) => {
            formatedMessage += ` ${msg}`;
        });
        formatedMessage += '\n';

        this.logDevice.write(formatedMessage);
    }

    console(message: string | object, ...args: string[]): void {
        console.log(message, ...args);
    }
}

// Define the types for the data structure
export interface RecordData {
    fullName: string;
    chineseName: string;
    phoneNo: string;
    amount: number;
    gender: string;
}

export interface ConfigData {
    sgNumber: string;
    subName: string;
    subEmail: string;
}

export interface ErrorData {
    type: 'data' | 'config';
    rowNumber: number;
    data: RecordData | ConfigData;
    message: string[];
}
