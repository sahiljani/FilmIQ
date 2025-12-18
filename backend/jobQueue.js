// Simple in-memory per-key FIFO job queue with retry support

const queues = new Map(); // key -> { running: boolean, pending: Array<job> }

function getQueue(key) {
  if (!queues.has(key)) {
    queues.set(key, { running: false, pending: [] });
  }
  return queues.get(key);
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Adds a job to the queue identified by key. The jobFn should return a Promise.
 * If the job throws an error with status 429, it will be retried after the suggested delay.
 */
async function runJob(queue, job) {
  try {
    const result = await job.fn();
    job.resolve(result);
  } catch (err) {
    const status = err?.status || err?.response?.status;
    if (status === 429) {
      // Parse retry delay from error if present
      let retryMs = 25000; // default 25s
      try {
        const details = typeof err.message === 'string' ? JSON.parse(err.message) : err;
        const retryInfo = details?.error?.details?.find?.(d => d['@type']?.includes('RetryInfo'));
        if (retryInfo?.retryDelay) {
          const seconds = parseInt(retryInfo.retryDelay.replace('s','')) || 25;
          retryMs = seconds * 1000;
        }
      } catch (_) {
        // ignore parse errors
      }
      console.log(`[JobQueue] 429 received. Retrying in ${Math.round(retryMs/1000)}s...`);
      await sleep(retryMs);
      return runJob(queue, job); // retry same job
    }
    job.reject(err);
  }
}

async function processQueue(key) {
  const queue = getQueue(key);
  if (queue.running) return;
  queue.running = true;
  try {
    while (queue.pending.length > 0) {
      const job = queue.pending.shift();
      await runJob(queue, job);
    }
  } finally {
    queue.running = false;
  }
}

function addJob(key, fn) {
  const queue = getQueue(key);
  return new Promise((resolve, reject) => {
    queue.pending.push({ fn, resolve, reject });
    processQueue(key);
  });
}

module.exports = { addJob };
