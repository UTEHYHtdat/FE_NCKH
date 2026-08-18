import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, CheckCircle2, Clock, Plus, X } from 'lucide-react';
import { Avatar } from './ui/avatar';

interface Task {
  id: number;
  task_name: string;
  task_description?: string;
  due_date: string;
  status: string; // e.g. PENDING, IN_PROGRESS, COMPLETED
  list_id?: number | null;
}

export interface KanbanList {
  id: number;
  name: string;
  order: number;
}

interface KanbanBoardProps {
  tasks: Task[];
  lists: KanbanList[];
  onOpenCreateDialog?: (listId?: number) => void;
  onAddList?: (name: string) => Promise<void>;
  onTaskClick?: (task: Task) => void;
}

export function KanbanBoard({
  tasks = [],
  lists = [],
  onOpenCreateDialog,
  onAddList,
  onTaskClick,
}: KanbanBoardProps) {
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  let columns: any[] = [];
  try {
    // Group tasks by list_id
    columns = (Array.isArray(lists) ? lists : []).map((list) => ({
      id: list?.id?.toString() || Math.random().toString(),
      listId: list?.id,
      label: list?.name || 'Unknown List',
      tasks: (Array.isArray(tasks) ? tasks : []).filter(
        (t) => t.list_id === list?.id,
      ),
    }));
  } catch (err) {
    console.error('Error grouping lists:', err, { lists, tasks });
  }

  // Add an "Unassigned List" column if there are tasks without a list_id
  const unassignedTasks = (Array.isArray(tasks) ? tasks : []).filter(
    (t) => !t.list_id,
  );
  if (unassignedTasks.length > 0) {
    columns.unshift({
      id: 'unassigned',
      listId: undefined,
      label: 'Chưa phân loại',
      tasks: unassignedTasks,
    });
  }

  const handleAddList = async () => {
    if (!newListName.trim() || !onAddList) {
      setIsAddingList(false);
      return;
    }
    try {
      setIsSubmitting(true);
      await onAddList(newListName.trim());
      setNewListName('');
      setIsAddingList(false);
    } catch (error) {
      console.error('Lỗi khi thêm danh sách', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 w-full h-full min-h-[500px]">
      {columns.map((column) => (
        <div
          key={column.id}
          className="flex-shrink-0 w-80 bg-zinc-50 rounded-xl flex flex-col max-h-full border border-zinc-200"
        >
          <div className="p-4 flex items-center justify-between border-b border-zinc-200 bg-zinc-50 rounded-t-xl sticky top-0 z-10">
            <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
              {column.label}
              <span className="text-xs bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full">
                {column.tasks.length}
              </span>
            </h3>
            <div className="text-zinc-400 font-bold tracking-widest leading-none">
              ...
            </div>
          </div>
          <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar bg-zinc-50/50">
            {column.tasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onTaskClick?.(task)}
                className="w-full bg-white hover:bg-zinc-100 p-3 rounded-lg border border-zinc-200 shadow-sm transition-colors cursor-pointer group text-left"
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 text-green-500 flex-shrink-0">
                    {task.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : task.status === 'IN_PROGRESS' ? (
                      <Clock className="w-4 h-4 text-blue-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-zinc-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800 break-words leading-snug">
                      {task.task_name}
                    </p>
                    {task.due_date &&
                      !isNaN(new Date(task.due_date).getTime()) && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(task.due_date).toLocaleDateString(
                              'vi-VN',
                            )}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="p-3 bg-zinc-50/50 rounded-b-xl border-t border-zinc-200">
            <button
              onClick={() => onOpenCreateDialog?.(column.listId)}
              className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Thêm thẻ
            </button>
          </div>
        </div>
      ))}

      {/* Add another list button */}
      <div className="flex-shrink-0 w-80">
        {isAddingList ? (
          <div className="bg-zinc-50 p-2 rounded-xl border border-zinc-200 shadow-sm">
            <input
              type="text"
              autoFocus
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="Nhập tên danh sách..."
              className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-lg text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddList();
                if (e.key === 'Escape') setIsAddingList(false);
              }}
              disabled={isSubmitting}
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddList}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Đang thêm...' : 'Thêm danh sách'}
              </button>
              <button
                onClick={() => setIsAddingList(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingList(true)}
            className="flex items-center gap-2 w-full p-3 rounded-xl bg-zinc-50/50 hover:bg-zinc-100/80 text-zinc-500 hover:text-zinc-700 transition-colors border border-transparent hover:border-zinc-300/50 text-sm font-medium"
          >
            <Plus className="w-5 h-5" />
            Thêm danh sách khác
          </button>
        )}
      </div>
    </div>
  );
}
