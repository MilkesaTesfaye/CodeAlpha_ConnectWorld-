import { EventEmitter } from 'events';
import logger from '../utils/logger';

type JobHandler = (payload: unknown) => Promise<void>;

interface Job {
  type: string;
  payload: unknown;
  id: string;
}

const jobEmitter = new EventEmitter();
const handlers = new Map<string, JobHandler>();
const CONCURRENCY = 5;
let activeJobs = 0;

/**
 * Register a handler for a job type.
 */
export function registerJobHandler(jobType: string, handler: JobHandler): void {
  handlers.set(jobType, handler);
}

/**
 * Enqueue a job to be processed in the background.
 */
export function enqueueJob(type: string, payload: unknown): void {
  const job: Job = {
    type,
    payload,
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
  jobEmitter.emit('job', job);
}

/**
 * Process the next job in the queue.
 */
async function processJob(job: Job): Promise<void> {
  const handler = handlers.get(job.type);
  if (!handler) {
    logger.warn(`No handler registered for job type: ${job.type}`);
    return;
  }

  activeJobs++;
  try {
    logger.debug(`Processing job: ${job.id} (${job.type})`);
    await handler(job.payload);
    logger.debug(`Job completed: ${job.id}`);
  } catch (error) {
    logger.error(`Job failed: ${job.id} (${job.type})`, error);
  } finally {
    activeJobs--;
  }
}

// Listen for new jobs with concurrency control
jobEmitter.on('job', (job: Job) => {
  if (activeJobs < CONCURRENCY) {
    processJob(job);
  } else {
    // Retry after a short delay
    setTimeout(() => jobEmitter.emit('job', job), 100);
  }
});

// Register default handlers
registerJobHandler('send_email', async (payload) => {
  const { to, subject } = payload as { to: string; subject: string };
  logger.info(`📧 Queued email to ${to}: ${subject}`);
  // Email sending is handled by the email utility
});

registerJobHandler('cleanup_meeting', async (payload) => {
  const { meetingId } = payload as { meetingId: string };
  logger.info(`🧹 Queueing cleanup for meeting ${meetingId}`);
});

export { registerJobHandler as registerHandler };
