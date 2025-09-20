import express from "express";
import cron from "node-cron";
// import { startSync } from './bdo.js';
// import { startSync } from './metro.js';
// import { startSync } from './union.js';
import { startSync } from './eastwest.js';

// cron.schedule("0 */3 * * *", async () => {
//   await startSync();
// });

// const app = express();
// app.get("/", (req, res) => res.send("Asset miner is running"));
// app.get("/run-bdo", (req, res) => {
//   startSync();
//   res.json({
//     message: 'BDO sync is now running',
//     status: 'ok'
//   });
// });
// app.listen(3000, () => console.log("App started on port 3000"));

startSync();