import { useEffect } from 'react';
import { get, set } from 'idb-keyval';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate: string | null;
  createdAt: number;
  priority: 'high' | 'medium' | 'low';
  type: 'single' | 'daily' | 'long_term';
  
  // single task (Focus Mode)
  focusDuration?: number; 
  
  // daily reminder
  reminderTime?: string; // e.g. "14:30"
  templateQuote?: string; // custom template for this daily task
  lastTriggeredDate?: string; // "YYYY-MM-DD"
  lastResetDate?: string; // "YYYY-MM-DD"
  
  // long term task
  currentProgress?: number;
  totalProgress?: number;
}

export interface TodoConfig {
  defaultFocusDuration: number;
  addQuotes: string[];
  completeQuotes: string[];
  overdueQuotes: string[];
  dailyReminderFallbackQuote: string;
}

export const DEFAULT_TODO_CONFIG: TodoConfig = {
  defaultFocusDuration: 25,
  addQuotes: [
    "记进小本本啦！",
    "我会盯着大家完成的~",
    "不要太累哦，但也要加油！",
    "既然写下来了就一定要做哦！",
  ],
  completeQuotes: [
    "好棒！摸摸头~",
    "辛苦啦，奖励一个抱抱！",
    "真厉害！今天也是超级棒的一天！",
    "做完啦？要不要休息一下~",
  ],
  overdueQuotes: [
    "怎么还没完成呀...",
    "遇到困难了吗？要帮忙吗？",
    "时间到了哦，快去完成吧！",
  ],
  dailyReminderFallbackQuote: "亲爱的，到时间去做「{text}」啦！要准时哦~",
};

export function TodoScheduler() {
  useEffect(() => {
    const checkSchedule = async () => {
      try {
        const savedTodosStr = window.localStorage.getItem('app_todos');
        if (!savedTodosStr) return;
        
        let todos: TodoItem[] = JSON.parse(savedTodosStr);
        let hasChanges = false;
        
        const now = new Date();
        const currentDateStr = now.toISOString().split('T')[0]; // "YYYY-MM-DD"
        const currentHour = now.getHours().toString().padStart(2, '0');
        const currentMinute = now.getMinutes().toString().padStart(2, '0');
        const currentTimeStr = `${currentHour}:${currentMinute}`; // "HH:MM"
        
        // Load custom config
        let todoConfig = DEFAULT_TODO_CONFIG;
        try {
          const customConfig = window.localStorage.getItem('app_todo_config');
          if (customConfig) {
            todoConfig = { ...DEFAULT_TODO_CONFIG, ...JSON.parse(customConfig) };
          }
        } catch (_) {}

        // Get character name for identification
        const charId = window.localStorage.getItem('app_charId')?.replace(/"/g, '') || '查理苏';

        // 1. Check daily resets & triggers
        const updatedTodos = todos.map(todo => {
          let updated = { ...todo };
          
          if (todo.type === 'daily') {
            // Check daily reset
            if (todo.lastResetDate !== currentDateStr) {
              updated.completed = false;
              updated.lastResetDate = currentDateStr;
              hasChanges = true;
            }
            
            // Check daily remind trigger
            if (
              todo.reminderTime === currentTimeStr &&
              !updated.completed &&
              todo.lastTriggeredDate !== currentDateStr
            ) {
              updated.lastTriggeredDate = currentDateStr;
              hasChanges = true;
              
              // Trigger the chat message insertion
              triggerChatNotification(todo, todoConfig, charId);
            }
          }
          
          return updated;
        });
        
        if (hasChanges) {
          window.localStorage.setItem('app_todos', JSON.stringify(updatedTodos));
          window.dispatchEvent(new CustomEvent('app_todos_changed'));
        }
      } catch (err) {
        console.error('TodoScheduler error:', err);
      }
    };

    const triggerChatNotification = async (todo: TodoItem, config: TodoConfig, charId: string) => {
      try {
        // Read old messages
        let msgs = await get('app_chatMessages');
        if (!msgs) {
          const local = window.localStorage.getItem('app_chatMessages');
          msgs = local ? JSON.parse(local) : [];
        }
        if (!Array.isArray(msgs)) msgs = [];
        
        const now = new Date();
        const h = now.getHours().toString().padStart(2, '0');
        const m = now.getMinutes().toString().padStart(2, '0');
        const timeStr = `${h}:${m}`;
        
        // Message template formatting
        let msgContent = todo.templateQuote || config.dailyReminderFallbackQuote;
        msgContent = msgContent.replace(/\{text\}/g, todo.text).replace(/\{name\}/g, todo.text);
        
        const reminderMsg = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
          sender: 'them',
          type: 'text',
          content: msgContent,
          time: timeStr
        };
        
        const newMsgs = [...msgs, reminderMsg];
        await set('app_chatMessages', newMsgs);
        
        // Dispatch instant reload logic for ChatView
        window.dispatchEvent(new CustomEvent('idbStateChanged', { 
          detail: { key: 'app_chatMessages', newValue: newMsgs } 
        }));
        
        // Push Notification if granted
        const pushNotify = window.localStorage.getItem('app_chatPushNotify');
        if ((pushNotify ? JSON.parse(pushNotify) : true) && 'Notification' in window && window.Notification.permission === 'granted') {
          new window.Notification(charId, { body: msgContent });
        }
      } catch (e) {
        console.error('Failed to trigger chat notification:', e);
      }
    };

    // Run immediately on boot and poll every 10 seconds to catch accurate minute matches
    checkSchedule();
    const timer = setInterval(checkSchedule, 10000);
    return () => clearInterval(timer);
  }, []);

  return null;
}
