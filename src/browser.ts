import { By, Builder, Browser, until, WebDriver } from 'selenium-webdriver';
import fs from 'fs';
import { ConfigData, CustomLogger, RecordData } from './types';

const targetUrl = 'https://tzuchiprodportal.azurewebsites.net/Donation/DonateNow';

async function processDonation(isDebug: boolean, driver: WebDriver, data: RecordData, submitter: ConfigData, logger: CustomLogger) {
    // payment type
    // tab1 - paynow
    // tab2 - Other Ways to Donate
    const paymentType = await driver.findElement(By.css('label[for="tab1"]'));
    paymentType.click();

    // donation type:
    // #first - Individual
    // #second - coperate
    // #third - Anonymous
    const donationType = await driver.findElement(By.css('a[href="#first"]'));
    donationType.click();

    const donationAmount = await driver.findElement(By.id('DonationAmount'));
    await donationAmount.sendKeys(data.amount);

    // donation frequency
    // donatemonthly
    // donateonce
    const donationFreq = await driver.findElement(By.id('donateonce'));
    await donationFreq.click();

    // donation option
    // donationformyself
    // donationforothers
    const donationOption = await driver.findElement(By.id('donationforothers'));
    await donationOption.click();

    let genderCode = '1';
    if (data.gender.toLowerCase() === 'f') {
        genderCode = '2';
    }
    const salutationTemp = await driver.findElement(By.xpath('//select[@id="con_Salutation"]/following-sibling::*[1]'));
    await salutationTemp.click();

    const salutation = await driver.findElement(By.xpath(`//select[@id="con_Salutation"]/following-sibling::*[1]/ul/li[@data-value="${genderCode}"]`));
    await salutation.click();

    const fullName = await driver.findElement(By.id('fname'));
    await fullName.sendKeys(data.fullName);

    const chineseName = await driver.findElement(By.id('lname'));
    await chineseName.sendKeys(data.chineseName);

    const phone = await driver.findElement(By.id('mobile'));
    await phone.sendKeys(data.phoneNo);

    const purposeTemp = await driver.findElement(By.xpath('//select[@id="ddlDonationPur"]/following-sibling::*[1]'));
    await purposeTemp.click();

    const purpose = await driver.findElement(By.xpath('//select[@id="ddlDonationPur"]/following-sibling::*[1]/ul/li[@data-value="db6898bd-eb27-ec11-b6e6-000d3ac94e2c"]'));
    await purpose.click();

    const tax = await driver.findElement(By.id('IsTaxDetect'));
    await tax.click();

    const sgNumber = await driver.findElement(By.id('txtVolunteerAppID'));
    await sgNumber.sendKeys(submitter.sgNumber);

    const subName = await driver.findElement(By.id('submitterFirstName'));
    await subName.sendKeys(submitter.subName);

    const subEmail = await driver.findElement(By.id('submitteremailaddress'));
    await subEmail.sendKeys(submitter.subEmail);

    if (isDebug) {
        try {
            // debugging, wait for 5 seconds
            await driver.wait(until.elementLocated(By.xpath('//div[@class="payment-result-modal__body"]/p/span/b')), 5000);
        } catch (error) {
            if (isDebug) console.log(error);

            logger.log('Wait timeout... Debuging...', data.fullName);

            // go back to DMS home
            await driver.get(targetUrl);

            return;
        }
    }

    const submt = await driver.findElement(By.id('btn_submit'));
    await submt.click();

    // get the TCF No
    const refNoDiv = await driver.findElement(By.xpath('//div[@class="header-info"]/div[@class="header-info__invoice"]'));
    const refNo = await refNoDiv.getText();
    logger.log('Please make PayNow payment for', refNo, '... in 30 seconds');

    const paynowSection = await driver.findElement(By.xpath('//div[@class="main-control"]/div[@class="accordion"]/div[3]'));
    await paynowSection.click();

    const qr = await driver.findElement(By.xpath('//form/div[@class="form-component"]/button[2]'));
    await qr.click();

    try {
        // wait for PayNow payment,max 30 seconds
        await driver.wait(until.elementLocated(By.xpath('//div[@class="payment-result-modal__body"]/p/span/b')), 30000);

        logger.log('Payment Successful for', refNo);

        driver.takeScreenshot().then(function (data) {
            const base64Data = data.replace(/^data:image\/png;base64,/, '');
            fs.writeFile(`${logger.logFolder}/${refNo}.png`, base64Data, 'base64', function (err) {
                if (err) console.log(err);
            });
        });

        // back to DMS home
        await driver.get(targetUrl);
    } catch (error) {
        if (isDebug) console.log(error);

        // back to DMS home
        await driver.get(targetUrl);

        // logger.log('Wait timeout...');
        logger.log('Payment failed for', refNo, '=== Wait for 30 seconds, timeout... ===');
        logger.logFile(data);
    }
}

export async function automate(submitter: ConfigData, datas: RecordData[], logger: CustomLogger, isDebug: boolean) {
    let driver;

    try {
        driver = await new Builder().forBrowser(Browser.CHROME).build();

        await driver.get(targetUrl);

        const title = await driver.getTitle();
        logger.logFile('Web form', title);

        await driver.manage().setTimeouts({ implicit: 2000 });

        for (const item of datas) {
            await processDonation(isDebug, driver, item, submitter, logger);
        }
    } catch (e) {
        console.log(e);
    } finally {
        await driver?.quit();
    }
}
