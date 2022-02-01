/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
require('dotenv').config();
require('chromedriver');

const { By, Key, WebElement } = require('selenium-webdriver');
const {
  getDriver, tryUntilDone, tryUntilError, sleep, shuffled,
} = require('./quiz/helper');

const questionsAnswers = require('./quiz/questionsAnswers.json');

async function quiz(quizUrl) {
  const studentsCredentials = shuffled(process.env.CREDENTIALS.split('\n'));

  // eslint-disable-next-line no-restricted-syntax
  for (const studentCredential of studentsCredentials) {
    const studentCredentials = studentCredential.split(' :: ');
    if (studentCredentials.length !== 2) {
      console.log('Format error in .env:\n\tformat should be: "<EMAIL> :: <PASSWORD>"\n');
    }
    const [studentEmail, studentPassword] = studentCredentials;
    const studentId = studentEmail.slice(0, 10);

    const driver = await getDriver(process.env.BINARY_PATH);
    await driver.get(quizUrl);

    await tryUntilDone(async () => {
      const googleEmailField = await driver.findElement(By.name('identifier'));
      await googleEmailField.sendKeys(studentEmail, Key.ENTER);
    }, 'Trying googleEmailField...');

    await tryUntilDone(async () => {
      const googlePasswordField = await driver.findElement(By.name('password'));
      await googlePasswordField.sendKeys(studentPassword, Key.ENTER);
    }, 'Trying googlePasswordField...');

    await tryUntilDone(async () => {
      const googleAllowButton = await driver.findElement(By.className('VfPpkd-LgbsSe'));
      await sleep(500);
      await googleAllowButton.click();
    }, 'Trying googleAllowButton...');

    /* ========================================================================================== */

    // let quizizzNameField = new WebElement();
    await tryUntilDone(async () => {
      const quizizzNameField = await driver.findElement(By.className('enter-name-field'));
      await quizizzNameField.clear();
      await quizizzNameField.sendKeys(studentId);
    }, 'Trying quizizzNameField');

    let content = [new WebElement()];
    let questionText = '';
    let previousQuestionText = ' ';
    for (let i = 0; i < Object.keys(questionsAnswers).length; i += 1) {
      // eslint-disable-next-line no-loop-func
      await tryUntilDone(async () => {
        content = await driver.findElements(By.className('resizeable'));
        questionText = await content.shift().getAttribute('textContent');
        if (questionText === previousQuestionText) {
          throw new Error('SAME');
        }
        previousQuestionText = questionText;
      }, 'Trying content and questionText...');

      const answers = content;
      // eslint-disable-next-line no-restricted-syntax
      for (const answer of answers) {
        const answerText = await answer.getAttribute('textContent');
        if (answerText === questionsAnswers[questionText]) {
          await tryUntilDone(async () => {
            await answer.click();
          }, 'Trying click... 1');
          await tryUntilError(async () => {
            await answer.click();
          }, 'Clicking... 1');
        }
      }
    }
    console.log(`\n\nDone ${studentId}, quitting in 10 seconds...\n\n`);
    await sleep(10000);
    await driver.quit();
  }
}

module.exports = { quiz };
