import type { Queue } from "bullmq";
import { emailJobOptions, getEmailQueue } from "../../configs/queues/bullmq.js";
import { withTimeout } from "../../lib/with-timeout.js";
import { type EmailJob, parseEmailJob } from "./job.js";

export async function enqueueEmail(value: EmailJob, queue?: Queue) {
  const job = parseEmailJob(value);
  const target = queue ?? getEmailQueue().queue;
  return withTimeout(target.add(job.template, job, emailJobOptions), 2_000);
}
