import cron from "node-cron";
import { startSync } from './bdo.js';

cron.schedule("0 */3 * * *", async () => {
  await startSync();
});
