import { ItemKey } from './types';
import { filterKeys } from '../util';

export enum Priority {
  Immediate = 1,
  Lazy = 2
}

type RequestId = number;

export type Scheduler = (callback: () => void) => RequestId;
export type UpdateCycle<Task> = (workload: ReadonlySet<Task>) => void;

type WorkQueueOptions<Task> = {
  immediateScheduler: Scheduler;
  lazyScheduler: Scheduler;
  update: UpdateCycle<Task>;
};

export default class WorkQueue<Task> {
  private readonly schedule: Map<Task, Priority> = new Map();
  private readonly remeasurementQueue: Map<ItemKey, Priority> = new Map();
  private readonly schedulers: { [priority in Priority]: Scheduler };
  private readonly scheduleRequests: {
    [priority in Priority]: RequestId | void
  };
  private readonly update: UpdateCycle<Task>;

  constructor(options: WorkQueueOptions<Task>) {
    this.update = options.update;
    this.schedulers = {
      [Priority.Immediate]: options.immediateScheduler,
      [Priority.Lazy]: options.lazyScheduler
    };
    this.scheduleRequests = {
      [Priority.Immediate]: undefined,
      [Priority.Lazy]: undefined
    };
  }

  enqueue(task: Task, priority: Priority) {
    this.doSchedule(priority);
    const currentPriority = this.schedule.get(task);
    this.schedule.set(
      task,
      currentPriority ? mostCritical(currentPriority, priority) : priority
    );
  }

  dequeue(priority: Priority): Set<Task> {
    const tasks = new Set<Task>();
    this.schedule.forEach((taskPriority, task) => {
      if (priority === taskPriority) {
        tasks.add(task);
        this.schedule.delete(task);
      }
    });
    return tasks;
  }

  private doSchedule(priority: Priority) {
    if (this.scheduleRequests[priority]) {
      return;
    }
    const scheduler = this.schedulers[priority];
    this.scheduleRequests[priority] = scheduler(() => {
      this.scheduleRequests[priority] = undefined;
      const workload = this.dequeue(priority);
      this.update.call(undefined, workload);
    });
  }
}

const mostCritical = (priority1: Priority, priority2: Priority): Priority => {
  return Math.min(priority1, priority2);
};

const matchesPriority = (
  currentPriority: Priority,
  scheduledPriority: Priority | void
): boolean => {
  if (!scheduledPriority) {
    return false;
  }
  return mostCritical(currentPriority, scheduledPriority) === scheduledPriority;
};
