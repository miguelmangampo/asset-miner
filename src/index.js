import express from "express";
import cron from "node-cron";
import { startSync as startBDO } from './bdo.js';
import { startSync as startMetro } from './metro.js';
import { startSync as startUnion } from './union.js';
import { startSync as startEastWest } from './eastwest.js';
import { startSync as startSecurity } from './security.js';
import { startSync as startLand } from './land.js';

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

// await startBDO();
// await startMetro();
// await startUnion();
// await startEastWest();
// await startSecurity();
await startLand();