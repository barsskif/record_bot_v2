import puppeteer, { executablePath } from 'puppeteer'
import fs from 'fs';
import { mkdir, open, unlink, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { launch, getStream } from "puppeteer-stream"
import ffmpeg from 'fluent-ffmpeg'

var page = {};
var browser = {};
var stream = {}
var file = {}

// ******************** открытие браузера *********************** //
export const openBrowser = async (req, res, server_url) => {
    console.log('server_url', req.query)
    // const private_code = req.body['private_code'];
    // console.log("=====> private_code", private_code)

    const hash = req.query.hash;
    const isRecord = req.query['is_record']
    const recordName = req.query['record_name']
    console.log("=====> hash", hash)

    if (browser[hash]) {
        const data = {
            status: 200,
            is_open_browser: true
        };

        return res.status(200).send({ data: data });
    }

    const url = `${server_url}`

    // ************* настройки для браузера ******************//
    browser[hash] = await launch({
        executablePath: executablePath(),
        defaultViewport: null,
        args: [
            // '--headless=chrome',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            `--window-size=1920,1080`,
            '--enable-experimental-web-platform-features',
            '--disable-infobars',
            '--enable-usermedia-screen-capturing',
            '--allow-http-screen-capture',
            '--auto-select-desktop-capture-source=webclip',
            '--auto-accept-this-tab-capture',
            '--ignore-certificate-errors',
            '--use-fake-device-for-media-stream',
            // '--use-fake-ui-for-media-stream',
            '--unsafely-treat-insecure-origin-as-secure=' + url
        ]
    });

    // ************* открываем новую вкладку ******************//
    page[hash] = browser[hash] && await browser[hash].newPage()

    // ************* переходи по указанному url ******************//
    await page[hash].goto(url)

    // ************* кликаем на отключения микрофона и входим в комнату  ******************//
    // const clickBtnOffMicAndEnter = () => {
    //     setTimeout(async () => {
    //         await page[hash].click('button[id="bot-btn-mic"]')
    //         await page[hash].click('button[id="btn-bot-record"]')
    //     }, 2000)
    // }

    // clickBtnOffMicAndEnter()

    // ************* включаем разрешения использовать камеру и микрофон по умолчанию  ******************//
    const context = browser[hash].defaultBrowserContext();
    context.clearPermissionOverrides();
    context.overridePermissions('https://stream.verbatica.ai?bot=mark1', ['camera', 'microphone']);

    // ************* Получаем версию браузера если он есть иначе будет null  ******************//
    const version = await page[hash].browser().version();
    console.info(`=====> OPEN BROWSER VERSION ${version} <=====`)


    // ************* отправляем ответ что все хорошо  ****************** //
    // ************* а так как браузеру в среднем требуется 3-4 сек, для того чтоб зайти то делаем искственную задержку  ****************** //

    // setTimeout(() => {
    //     const data = {
    //         status: 200,
    //         is_open_browser: true
    //     };

    //     return res.status(200).send({ data: data });
    // }, 5000)

    // ************* Ожидание начала загрузки новой страницы  ****************** //
    // const navigationPromise = page[hash].waitForNavigation();


    // ************* Ожидание начала загрузки новой страницы  ****************** //
    // await navigationPromise;


    // ************* Теперь страница полностью загружена, можно работать дальше  ****************** //
    console.log('************* Теперь страница полностью загружена, можно работать дальше  ******************');

    // Получение кнопки по ID
    const recordButton = await page[hash].$('#recordButton');

    if (recordButton) {
        console.log('Кнопка найдена');
        // Вы можете взаимодействовать с кнопкой, используя переменную recordButton, например:
        await recordButton.click();
        console.log(recordButton)
    } else {
        console.log('Кнопка не найдена');
    }

    const data = {
        is_record: isRecord,
        hash: hash,
        record_name: recordName
    }

    startRecordEndStopRecord(data, res)

};

// ******************** старт и стоп записи с сохранением в папку *********************** //
export const startRecordEndStopRecord = async (req, res) => {
    // const isRecord = req.body['is_record']
    // const recordName = req.body['record_name']
    // const hash = req.body['hash']
    const isRecord = req?.query?.is_record || req['is_record']
    const recordName = req?.query?.record_name || req['record_name']
    const hash = req?.query?.hash || req['hash']
    console.log(typeof isRecord, recordName, hash)


    if (isRecord === "true") {
        const __dirname = dirname(fileURLToPath(import.meta.url))
        const videoPath = join(__dirname, '../records')
        const dirNameYear = new Date().toLocaleDateString().split('/')[2]
        const dirNameMonth = new Date().toLocaleDateString().split('/')[0]
        const dirNameDay = new Date().toLocaleDateString().split('/')[1]
        // const dirPath = `${videoPath}/${dirNameYear}/${dirNameMonth}/${dirNameDay}`
        const dirPath = `${videoPath}`

        let fileHandle
        try {
            fileHandle = await open(dirPath)
        } catch {
            await mkdir(dirPath, {
                recursive: true,
            })
        } finally {
            if (fileHandle) {
                fileHandle.close()
            }
        }

        const fileName = `${Date.now()}-${recordName}.webm`
        const tempFilePath = `${dirPath}/temp-${fileName}`

        file = fs.createWriteStream(tempFilePath);

        stream[hash] = await getStream(page[hash], { audio: true, video: true });
        console.log("recording");

        stream[hash].pipe(file);


        console.log("START RECORDING")
        const data = {
            status: 200,
            is_record: 'start',

        };

        return res.status(200).send({ data: data });
    }

    if (isRecord === "false") {
        await stream[hash].destroy();
        await file.close();

        console.log("finished");
        // xvfb.stopSync();


        console.log("🚀 =====> browser", browser)
        console.log("STOP RECORDING", file.path)

        const closeData = {
            hash: hash
        }


        closeBrowser(closeData)

        console.log("******************** close browser *********************** ")

        const data = {
            status: 200,
            is_record: 'stop',
            file_path: file.path

        };

        return res.status(200).send({ data: data });
    }
}


export const closeBrowser = async ({ hash }) => {

    try {
        await browser[hash].close()
        delete browser[hash];


        console.info(`=====> BROWSER CLOSE <=====`)
        console.log(browser)


    } catch (error) {
        console.log('error', error)
    }
}