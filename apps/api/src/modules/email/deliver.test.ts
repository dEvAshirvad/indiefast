import { Queue } from "bullmq";
import { expect, test } from "vitest";
import { env } from "../../configs/env.js";
import { emailJobOptions } from "../../configs/queues/bullmq.js";
import { deliverEmail } from "./deliver.js";
import { enqueueEmail } from "./enqueue.js";

test("enqueue stores the template and the retry policy", async () => {
  const queue = new Queue("email-lesson", {
    connection: {
      host: env.redisHost,
      port: env.redisPort,
      password: env.redisPassword,
      maxRetriesPerRequest: null,
    },
  });
  try {
    const added = await enqueueEmail(
      { to: "a@example.com", template: "verify", url: "http://localhost/v" },
      queue,
    );
    expect(added.data).toEqual({
      to: "a@example.com",
      template: "verify",
      url: "http://localhost/v",
    });
    expect(added.opts.attempts).toBe(emailJobOptions.attempts);
  } finally {
    await queue.obliterate({ force: true });
    await queue.close();
  }
});

test("deliverEmail calls send and does not talk to SMTP", async () => {
  const sent: unknown[] = [];
  await deliverEmail(
    { to: "a@example.com", template: "welcome" },
    async (message) => {
      sent.push(message);
    },
  );
  expect(sent).toEqual([
    {
      to: "a@example.com",
      subject: "Welcome to IndieFast",
      html: "<p>Your account is ready.</p>",
      text: "Your account is ready.",
    },
  ]);
});
