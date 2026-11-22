const cron = require('node-cron');
const Notification = require('../models/Notification');
const NotificationDispatchLog = require('../models/NotificationDispatchLog');
const LibraryLoan = require('../models/LibraryLoan');
const Card = require('../models/Card');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const notificationService = require('../services/notificationService');
const { formatDate } = require('../constants/notificationCatalog');

let scheduledTask = null;

/**
 * Sweep and dispatch scheduled notifications whose time has arrived.
 */
const sweepScheduledSends = async () => {
  try {
    const dueNotifications = await Notification.find({
      status: 'SCHEDULED',
      scheduledAt: { $lte: new Date() },
    });

    for (const notif of dueNotifications) {
      await notificationService.dispatchNotification(notif);
    }
  } catch (err) {
    console.error('[Scheduler] Error in sweepScheduledSends:', err.message);
  }
};

/**
 * Sweep and retry failed dispatch logs with backoff.
 */
const sweepRetryDispatch = async () => {
  try {
    const pendingLogs = await NotificationDispatchLog.find({
      status: 'PENDING',
      nextAttemptAt: { $lte: new Date() },
    }).populate('notification');

    for (const log of pendingLogs) {
      if (!log.notification) {
        log.status = 'DEAD';
        await log.save();
        continue;
      }

      if (log.attemptCount >= 5) {
        log.status = 'DEAD';
        await log.save();
        continue;
      }

      try {
        await notificationService.dispatchNotification(log.notification);
        log.status = 'SUCCESS';
        await log.save();
      } catch (retryErr) {
        log.attemptCount += 1;
        log.lastAttemptAt = new Date();
        log.error = retryErr.message;

        // Exponential backoff: 1 min, 5 min, 30 min, 2 hours
        const backoffMinutes = [1, 5, 30, 120][Math.min(log.attemptCount - 1, 3)];
        log.nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

        if (log.attemptCount >= 5) {
          log.status = 'DEAD';
        }
        await log.save();
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error in sweepRetryDispatch:', err.message);
  }
};

/**
 * Reminder jobs for library, cards, and events (idempotent via dedupeKey).
 */
const runReminderJobs = async () => {
  const now = new Date();

  // 1. BOOK_DUE_SOON (2 days before due date)
  try {
    const twoDaysAhead = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const dueSoonLoans = await LibraryLoan.find({
      status: 'BORROWED',
      dueAt: { $gt: now, $lte: twoDaysAhead },
    });

    for (const loan of dueSoonLoans) {
      await notificationService.createAndDispatch({
        type: 'BOOK_DUE_SOON',
        audience: 'individual',
        receiver: loan.borrower,
        relatedType: 'BookLoan',
        relatedId: loan._id,
        dedupeKey: `BOOK_DUE_SOON:${loan._id}`,
        templateData: {
          bookTitle: loan.bookTitle,
          dueDate: formatDate(loan.dueAt),
        },
      });
    }
  } catch (err) {
    console.error('[Scheduler] Error in BOOK_DUE_SOON job:', err.message);
  }

  // 2. BOOK_OVERDUE (overdue loans)
  try {
    const overdueLoans = await LibraryLoan.find({
      status: 'BORROWED',
      dueAt: { $lt: now },
    }).populate('borrower', 'fullName email');

    for (const loan of overdueLoans) {
      const days = Math.max(
        1,
        Math.floor((now.getTime() - new Date(loan.dueAt).getTime()) / (24 * 60 * 60 * 1000))
      );
      const weekIndex = Math.floor(days / 7);

      // Student notification (weekly dedupeKey)
      await notificationService.createAndDispatch({
        type: 'BOOK_OVERDUE',
        audience: 'individual',
        receiver: loan.borrower._id,
        relatedType: 'BookLoan',
        relatedId: loan._id,
        dedupeKey: `BOOK_OVERDUE:${loan._id}:w${weekIndex}`,
        templateData: {
          bookTitle: loan.bookTitle,
          days,
        },
      });

      // Staff librarian copy
      await notificationService.createAndDispatch({
        type: 'BOOK_OVERDUE_STAFF',
        audience: 'role',
        role: 'librarian',
        relatedType: 'BookLoan',
        relatedId: loan._id,
        dedupeKey: `BOOK_OVERDUE_STAFF:${loan._id}:w${weekIndex}`,
        templateData: {
          studentName: loan.borrower?.fullName || 'Học sinh',
          bookTitle: loan.bookTitle,
          days,
        },
      });
    }
  } catch (err) {
    console.error('[Scheduler] Error in BOOK_OVERDUE job:', err.message);
  }

  // 3. CARD_EXPIRING & CARD_EXPIRED
  try {
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringCards = await Card.find({
      status: 'ACTIVE',
      expiresAt: { $gt: now, $lte: thirtyDaysAhead },
    });

    for (const card of expiringCards) {
      await notificationService.createAndDispatch({
        type: 'CARD_EXPIRING',
        audience: 'individual',
        receiver: card.owner,
        relatedType: 'Card',
        relatedId: card._id,
        dedupeKey: `CARD_EXPIRING:${card._id}:${card.expiresAt.toISOString().slice(0, 10)}`,
        templateData: {
          cardCode: card.cardCode,
          date: formatDate(card.expiresAt),
        },
      });
    }

    const expiredCards = await Card.find({
      status: 'ACTIVE',
      expiresAt: { $lt: now },
    });

    for (const card of expiredCards) {
      await notificationService.createAndDispatch({
        type: 'CARD_EXPIRED',
        audience: 'individual',
        receiver: card.owner,
        relatedType: 'Card',
        relatedId: card._id,
        dedupeKey: `CARD_EXPIRED:${card._id}`,
        templateData: {
          cardCode: card.cardCode,
          date: formatDate(card.expiresAt),
        },
      });
    }
  } catch (err) {
    console.error('[Scheduler] Error in Card expiration job:', err.message);
  }

  // 4. EVENT_REMINDER (events starting today)
  try {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const todayEvents = await Event.find({
      startAt: { $gte: startOfToday, $lte: endOfToday },
    });

    for (const event of todayEvents) {
      const registrations = await EventRegistration.find({ event: event._id });
      for (const reg of registrations) {
        await notificationService.createAndDispatch({
          type: 'EVENT_REMINDER',
          audience: 'individual',
          receiver: reg.student,
          relatedType: 'Event',
          relatedId: event._id,
          dedupeKey: `EVENT_REMINDER:${event._id}:${reg.student}`,
          templateData: {
            eventName: event.title,
            start: formatDate(event.startAt),
          },
        });
      }
    }
  } catch (err) {
    console.error('[Scheduler] Error in EVENT_REMINDER job:', err.message);
  }
};

/**
 * Initialize all cron jobs (Runs every 1 minute).
 */
const initScheduler = () => {
  if (scheduledTask) {
    return scheduledTask;
  }

  // Run every minute
  scheduledTask = cron.schedule('* * * * *', async () => {
    try {
      await sweepScheduledSends();
      await sweepRetryDispatch();
      await runReminderJobs();
    } catch (e) {
      console.error('[Scheduler] Error during execution cycle:', e.message);
    }
  });

  console.log('[Scheduler] Notification scheduler initialized');
  return scheduledTask;
};

const stopScheduler = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
};

module.exports = {
  initScheduler,
  stopScheduler,
  sweepScheduledSends,
  sweepRetryDispatch,
  runReminderJobs,
};

