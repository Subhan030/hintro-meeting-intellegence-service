import TelegramBot from "node-telegram-bot-api";
import { logger } from "../config/logger";
import { IActionItem } from "../models/ActionItem";

export class NotificationService {
  private bot: TelegramBot | null = null;
  private chatId: string | null = null;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (token && chatId) {
      this.bot = new TelegramBot(token, { polling: false });
      this.chatId = chatId;
      logger.info("Telegram bot initialized successfully");
    } else {
      logger.warn(
        "Telegram bot not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env"
      );
    }
  }

  async sendTelegramReminder(actionItem: IActionItem): Promise<boolean> {
    if (!this.bot || !this.chatId) {
      logger.warn("Telegram bot not configured, skipping reminder");
      return false;
    }

    try {
      const meeting = actionItem.meetingId as any;
      const owner = actionItem.ownerId as any;

      const message = this.formatReminderMessage(actionItem, meeting, owner);

      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: "Markdown",
      });

      logger.info({
        actionItemId: actionItem._id,
        assignee: actionItem.assignee,
        message: "Telegram reminder sent successfully",
      });

      return true;
    } catch (error: any) {
      logger.error({
        error: error.message,
        actionItemId: actionItem._id,
        message: "Failed to send Telegram reminder",
      });
      return false;
    }
  }

  private formatReminderMessage(
    actionItem: IActionItem,
    meeting: any,
    owner: any
  ): string {
    const dueDate = new Date(actionItem.dueDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const overdueBy = Math.floor(
      (Date.now() - new Date(actionItem.dueDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    return `
🚨 *Overdue Action Item Reminder*

*Task:* ${actionItem.task}
*Assigned To:* ${actionItem.assignee}
*Due Date:* ${dueDate}
*Status:* ${actionItem.status}
*Overdue By:* ${overdueBy} day(s)

*Meeting:* ${meeting?.title || "Unknown"}
*Owner:* ${owner?.name || owner?.email || "Unknown"}

_Please update the status or complete this task as soon as possible._
    `.trim();
  }

  async sendTestMessage(message: string): Promise<boolean> {
    if (!this.bot || !this.chatId) {
      logger.warn("Telegram bot not configured");
      return false;
    }

    try {
      await this.bot.sendMessage(this.chatId, message);
      logger.info("Test message sent successfully");
      return true;
    } catch (error: any) {
      logger.error({
        error: error.message,
        message: "Failed to send test message",
      });
      return false;
    }
  }

  isConfigured(): boolean {
    return this.bot !== null && this.chatId !== null;
  }
}

export const notificationService = new NotificationService();
