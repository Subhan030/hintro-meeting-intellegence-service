import * as cron from "node-cron";
import { actionItemService } from "../services/actionItem.service";
import { notificationService } from "../services/notification.service";
import { logger } from "../config/logger";

export class ReminderJob {
  private task: cron.ScheduledTask | null = null;

  start() {

    this.task = cron.schedule("0 * * * *", async () => {
      await this.processOverdueReminders();
    });

    logger.info("Reminder scheduler started - runs every hour");
  }

  stop() {
    if (this.task) {
      this.task.stop();
      logger.info("Reminder scheduler stopped");
    }
  }


  async runNow() {
    logger.info("Manually triggering reminder job");
    await this.processOverdueReminders();
  }

  private async processOverdueReminders() {
    try {
      logger.info("Starting overdue reminders check");


      const overdueItems = await actionItemService.getOverdueItems();

      logger.info({
        count: overdueItems.length,
        message: "Found overdue action items",
      });

      if (overdueItems.length === 0) {
        logger.info("No overdue items found");
        return;
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const item of overdueItems) {

        const lastReminder = item.reminderHistory[item.reminderHistory.length - 1];
        if (lastReminder) {
          const hoursSinceLastReminder =
            (Date.now() - new Date(lastReminder.sentAt).getTime()) /
            (1000 * 60 * 60);

          if (hoursSinceLastReminder < 24) {
            logger.info({
              actionItemId: item._id,
              message: "Reminder already sent in last 24 hours, skipping",
            });
            continue;
          }
        }


        const sent = await notificationService.sendTelegramReminder(item);

        if (sent) {

          await actionItemService.recordReminder(
            item._id.toString(),
            "telegram"
          );
          sentCount++;
        } else {
          failedCount++;
        }
      }

      logger.info({
        total: overdueItems.length,
        sent: sentCount,
        failed: failedCount,
        message: "Reminder job completed",
      });
    } catch (error: any) {
      logger.error({
        error: error.message,
        stack: error.stack,
        message: "Error in reminder job",
      });
    }
  }
}

export const reminderJob = new ReminderJob();
