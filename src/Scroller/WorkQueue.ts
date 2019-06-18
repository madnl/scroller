import { ItemKey } from './types';
import { filterKeys } from '../util';

type Task =
  | 'measureNewItems'
  | 'recalculateRendition'
  | 'normalize'
  | 'sampleScrollOffset'
  | 'sampleViewportSize';

export type Priority = 'immediate' | 'lazy';

export type Workload = {
  measureNewItems: boolean;
  remeasureItems: ReadonlySet<ItemKey>;
  recalculateRendition: boolean;
  sampleScrollOffset: boolean;
  sampleViewportSize: boolean;
  normalize: boolean;
};

type RequestId = number;

export type Scheduler = (callback: () => void) => RequestId;
export type UpdateCycle = (workload: Workload) => void;

type WorkQueueOptions = {
  immediateScheduler: Scheduler;
  lazyScheduler: Scheduler;
  update: UpdateCycle;
};

export default class WorkQueue {
  private readonly schedule: { [task in Task]: Priority | void } = {
    measureNewItems: undefined,
    recalculateRendition: undefined,
    normalize: undefined,
    sampleScrollOffset: undefined,
    sampleViewportSize: undefined
  };
  private readonly remeasurementQueue: Map<ItemKey, Priority> = new Map();
  private readonly schedulers: { [priority in Priority]: Scheduler };
  private readonly scheduleRequests: {
    [priority in Priority]: RequestId | void
  };
  private readonly update: UpdateCycle;

  constructor(options: WorkQueueOptions) {
    this.update = options.update;
    this.schedulers = {
      immediate: options.immediateScheduler,
      lazy: options.lazyScheduler
    };
    this.scheduleRequests = { immediate: undefined, lazy: undefined };
  }

  measureNewItems(priority: Priority) {
    this.enqueue('measureNewItems', priority);
  }

  remeasureItem(itemKey: ItemKey, priority: Priority) {
    this.doSchedule(priority);
    const currentPriority = this.remeasurementQueue.get(itemKey);
    this.remeasurementQueue.set(
      itemKey,
      currentPriority ? mostCritical(priority, currentPriority) : priority
    );
  }

  sampleScrollOffset(priority: Priority) {
    this.enqueue('sampleScrollOffset', priority);
  }

  recalculateRendition(priority: Priority) {
    this.enqueue('recalculateRendition', priority);
  }

  private enqueue(task: Task, priority: Priority) {
    this.doSchedule(priority);
    const currentPriority = this.schedule[task];
    this.schedule[task] = currentPriority
      ? mostCritical(currentPriority, priority)
      : priority;
  }

  dequeue(priority: Priority): Workload {
    const itemsToBeRemeasured = filterKeys(
      this.remeasurementQueue,
      itemPriority => itemPriority === priority
    );
    itemsToBeRemeasured.forEach(key => this.remeasurementQueue.delete(key));
    return {
      measureNewItems: this.dequeueTask(priority, 'measureNewItems'),
      remeasureItems: itemsToBeRemeasured,
      recalculateRendition: this.dequeueTask(priority, 'recalculateRendition'),
      sampleScrollOffset: this.dequeueTask(priority, 'sampleScrollOffset'),
      sampleViewportSize: this.dequeueTask(priority, 'sampleViewportSize'),
      normalize: this.dequeueTask(priority, 'normalize')
    };
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

  private dequeueTask(priority: Priority, task: Task): boolean {
    if (matchesPriority(priority, this.schedule[task])) {
      this.schedule[task] = undefined;
      return true;
    }
    return false;
  }
}

const mostCritical = (priority1: Priority, priority2: Priority): Priority => {
  if (priority1 === 'immediate' || priority2 === 'immediate') {
    return 'immediate';
  }
  return 'lazy';
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
