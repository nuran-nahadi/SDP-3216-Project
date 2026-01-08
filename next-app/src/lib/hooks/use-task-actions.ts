import { useState } from 'react';
import { Task } from '@/lib/types/task';
import { completeTask, deleteTask } from '@/lib/api/tasks';
import { eventBus } from '@/lib/utils/event-bus';
import { TASK_COMPLETED, TASK_DELETED } from '@/lib/utils/event-types';
import { handleApiError } from '@/lib/utils/error-handler';
import { toast } from 'sonner';

interface UseTaskActionsReturn {
  completeTaskAction: (taskId: string, actualDuration?: number) => Promise<void>;
  deleteTaskAction: (taskId: string) => Promise<void>;
  isProcessing: boolean;
}

export function useTaskActions(): UseTaskActionsReturn {
  const [isProcessing, setIsProcessing] = useState(false);

  const completeTaskAction = async (taskId: string, actualDuration?: number) => {
    try {
      setIsProcessing(true);
      const data = actualDuration ? { actual_duration: actualDuration } : undefined;
      const response = await completeTask(taskId, data);
      eventBus.publish(TASK_COMPLETED, response.data);
      toast.success('Task completed successfully');
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteTaskAction = async (taskId: string) => {
    try {
      setIsProcessing(true);
      await deleteTask(taskId);
      eventBus.publish(TASK_DELETED, { id: taskId });
      toast.success('Task deleted successfully');
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    completeTaskAction,
    deleteTaskAction,
    isProcessing,
  };
}
