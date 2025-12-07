/**
 * 空闲任务调度器
 *
 * 类似 requestIdleCallback，但确保即使浏览器持续繁忙，任务也会在指定的超时时间后执行
 */

import { useSyncExternalStore } from 'react';

export interface TaskOptions {
  /** 最大等待时间（毫秒），超过此时间后强制执行任务 */
  timeout?: number;
  /** 任务优先级，数字越小优先级越高 */
  priority?: number;
}

interface ScheduledTask {
  id: number;
  callback: (deadline: IdleDeadline) => void;
  timeout: number;
  priority: number;
  scheduledAt: number;
  timeoutId?: number;
  idleCallbackId?: number;
}

// 模拟 IdleDeadline 接口（用于 setTimeout 降级）
interface IdleDeadline {
  didTimeout: boolean;
  timeRemaining: () => number;
}

type Listener = (count: number) => void;

class IdleTaskScheduler {
  private tasks = new Map<number, ScheduledTask>();
  private taskIdCounter = 0;
  private isProcessing = false;
  private hasIdleCallback = typeof requestIdleCallback !== 'undefined';
  private listeners = new Set<Listener>();

  /**
   * 订阅任务数量变化
   * @param listener 监听器
   * @returns 取消订阅的函数
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const count = this.tasks.size;
    for (const listener of this.listeners) {
      listener(count);
    }
  }

  /**
   * 调度一个任务在浏览器空闲时执行
   * @param callback 要执行的回调函数
   * @param options 调度选项
   * @returns 任务 ID，用于取消任务
   */
  scheduleTask(
    callback: (deadline: IdleDeadline) => void,
    options: TaskOptions = {}
  ): number {
    const taskId = ++this.taskIdCounter;
    const timeout = options.timeout ?? 2000; // 默认 2 秒超时
    const priority = options.priority ?? 0;

    const task: ScheduledTask = {
      id: taskId,
      callback,
      timeout,
      priority,
      scheduledAt: Date.now(),
    };

    this.tasks.set(taskId, task);
    this.notifyListeners();

    // 设置超时强制执行
    task.timeoutId = window.setTimeout(() => {
      this.executeTask(taskId, true);
    }, timeout);

    // 尝试在空闲时执行
    this.scheduleNextTask();

    return taskId;
  }

  /**
   * 取消一个已调度的任务
   * @param taskId 任务 ID
   */
  cancelTask(taskId: number): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    // 清理定时器
    if (task.timeoutId !== undefined) {
      clearTimeout(task.timeoutId);
    }

    // 清理 idle callback
    if (task.idleCallbackId !== undefined) {
      if (this.hasIdleCallback) {
        cancelIdleCallback(task.idleCallbackId);
      } else {
        clearTimeout(task.idleCallbackId);
      }
    }

    this.tasks.delete(taskId);
    this.notifyListeners();
  }

  /**
   * 取消所有待执行的任务
   */
  cancelAll(): void {
    for (const taskId of this.tasks.keys()) {
      this.cancelTask(taskId);
    }
  }

  /**
   * 获取待执行任务数量
   */
  getPendingTaskCount(): number {
    return this.tasks.size;
  }

  private scheduleNextTask(): void {
    if (this.isProcessing || this.tasks.size === 0) return;

    this.isProcessing = true;

    if (this.hasIdleCallback) {
      // 使用原生 requestIdleCallback
      requestIdleCallback((deadline) => {
        this.processIdleTasks(deadline);
        this.isProcessing = false;
        this.scheduleNextTask();
      });
    } else {
      // 降级到 setTimeout
      setTimeout(() => {
        const deadline = this.createMockDeadline(false);
        this.processIdleTasks(deadline);
        this.isProcessing = false;
        this.scheduleNextTask();
      }, 0);
    }
  }

  private processIdleTasks(deadline: IdleDeadline): void {
    // 按优先级排序任务
    const sortedTasks = Array.from(this.tasks.values()).sort(
      (a, b) => a.priority - b.priority
    );

    for (const task of sortedTasks) {
      // 如果没有剩余时间，停止处理
      if (deadline.timeRemaining() <= 0 && !deadline.didTimeout) {
        break;
      }

      // 执行任务
      this.executeTask(task.id, false);

      // 如果时间不够，让出控制权
      if (deadline.timeRemaining() <= 1) {
        break;
      }
    }
  }

  private executeTask(taskId: number, didTimeout: boolean): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    try {
      // 清理超时定时器
      if (task.timeoutId !== undefined) {
        clearTimeout(task.timeoutId);
      }

      // 创建 deadline 对象
      const deadline = this.createMockDeadline(didTimeout);

      // 执行回调
      task.callback(deadline);
    } catch (error) {
      console.error('执行任务时出错:', error);
    } finally {
      // 移除任务
      this.tasks.delete(taskId);
      this.notifyListeners();
    }
  }

  private createMockDeadline(didTimeout: boolean): IdleDeadline {
    const startTime = Date.now();
    return {
      didTimeout,
      timeRemaining: () => {
        // 模拟 50ms 的可用时间
        const elapsed = Date.now() - startTime;
        return Math.max(0, 50 - elapsed);
      },
    };
  }
}

// 导出单例实例
export const scheduler = new IdleTaskScheduler();

/**
 * 调度一个空闲任务
 * @param callback 任务回调
 * @param options 调度选项
 * @returns 任务 ID
 *
 * @example
 * ```ts
 * const taskId = scheduleIdleTask(() => {
 *   console.log('在空闲时执行');
 * }, { timeout: 1000 });
 *
 * // 取消任务
 * cancelIdleTask(taskId);
 * ```
 */
export function scheduleIdleTask(
  callback: (deadline: IdleDeadline) => void,
  options?: TaskOptions
): number {
  return scheduler.scheduleTask(callback, options);
}

/**
 * 取消一个空闲任务
 * @param taskId 任务 ID
 */
export function cancelIdleTask(taskId: number): void {
  scheduler.cancelTask(taskId);
}

/**
 * 取消所有空闲任务
 */
export function cancelAllIdleTasks(): void {
  scheduler.cancelAll();
}

/**
 * React hook: 订阅待执行任务数量
 * @returns 当前待执行任务数量
 */
export function usePendingTaskCount(): number {
  return useSyncExternalStore(
    (onStoreChange) => scheduler.subscribe(onStoreChange),
    () => scheduler.getPendingTaskCount(),
    () => 0
  );
}
