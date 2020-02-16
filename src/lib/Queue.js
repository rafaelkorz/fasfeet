import Bee from 'bee-queue';
import OrderMail from '../app/jobs/OrderMail';
import redisConfig from '../config/redis';

const jobs = [OrderMail];

class Queue {
  constructor() {
    this.queus = {};

    this.init();
  }

  init() {
    jobs.forEach(({ key, handle }) => {
      this.queus[key] = {
        bee: new Bee(key, {
          redis: redisConfig
        }),
        handle
      };
    });
  }

  add(queue, job) {
    return this.queus[queue].bee.createJob(job).save();
  }

  processQueue() {
    jobs.forEach(job => {
      const { bee, handle } = this.queus[job.key];
      bee.on('failed', this.handleFailure).process(handle);
    });
  }

  handleFailure(job, err) {
    console.log(`Queue ${job.queue.name}: FAILED`, err);
  }
}

export default new Queue();
