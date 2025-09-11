import express from "express";
import cron from "node-cron";
import { startSync } from './bdo.js';

const app = express();

// cron.schedule("0 */3 * * *", async () => {
//   await startSync();
// });

app.get("/", (req, res) => res.send("Asset miner is running"));
app.get("/run-bdo", (req, res) => {
  startSync();
  res.json({
    message: 'BDO sync is now running',
    status: 'ok'
  });
});
app.listen(3000, () => console.log("App started on port 3000"));