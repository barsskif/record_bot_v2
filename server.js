// @ts-nocheck
import express from 'express'
import dotenv from 'dotenv';

import Xvfb from 'xvfb';
import http from "http";
import cors from 'cors'
import { closeBrowser, openBrowser, startRecordEndStopRecord } from './service/Puppeter.js'

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const serverUrlDefaul = process.env.SERVER_URL;
const xvfb = new Xvfb({
  xvfb_args: ["-screen", "0", '1280x1080x24', "-ac"],
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH']
}))

app.use(express.json())

const server = http.createServer(app)

xvfb.start((err, xvfbProcess) => {
  console.log(`xvfb running on`);

  if (err) {
    console.log(`xvfb not running ${err}`);
  }

});

app.get('/api/bot/start_bot', (req, res) => openBrowser(req, res, 'https://stream.verbatica.ai?bot=mark1'));

app.post('/api/bot/disconnect', (req, res) => closeBrowser(req, res));

app.get('/api/bot/is_record', async (req, res) => {
  startRecordEndStopRecord(req, res)
});


app.use((req, res, next) => {
  console.log('page not found ((')
  res.status(404).send({ code: 404, desc: 'Sorry, page not found' });
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at ${serverUrlDefaul}:${port}`);
});

