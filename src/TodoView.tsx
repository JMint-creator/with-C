import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, Plus, Check, Trash2, Calendar, AlertCircle, 
  Play, Pause, Settings, Edit2, Clock, Sparkles, 
  RotateCcw, Sliders, Info, MessageSquare, Save, X, BookOpen, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { get, set } from 'idb-keyval';
import { TodoItem, TodoConfig, DEFAULT_TODO_CONFIG } from './TodoScheduler';

interface TodoViewProps {
  onClose: () => void;
  themeConfig: any;
  avatar2: string;
  name2: string;
  cardGroups: { id: string, name: string, cards: string[] }[];
}

export function TodoView({ onClose, themeConfig, avatar2, name2, cardGroups }: TodoViewProps) {
  // 1. Core States
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    try {
      const saved = window.localStorage.getItem('app_todos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [todoConfig, setTodoConfig] = useState<TodoConfig>(() => {
    try {
      const saved = window.localStorage.getItem('app_todo_config');
      return saved ? { ...DEFAULT_TODO_CONFIG, ...JSON.parse(saved) } : DEFAULT_TODO_CONFIG;
    } catch {
      return DEFAULT_TODO_CONFIG;
    }
  });

  // UI Active State
  const [activeTab, setActiveTab] = useState<'all' | 'single' | 'daily' | 'long_term'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Form Inputs
  const [inputValue, setInputValue] = useState('');
  const [taskType, setTaskType] = useState<'single' | 'daily' | 'long_term'>('single');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState('');
  
  // Custom single duration config
  const [focusMinutes, setFocusMinutes] = useState(25);
  
  // Custom Daily Reminder inputs
  const [reminderTime, setReminderTime] = useState('09:00');
  const [customDailyQuote, setCustomDailyQuote] = useState('');

  // Custom Long-term inputs
  const [targetProgress, setTargetProgress] = useState(100);

  // Active Focus Mode States
  const [activeFocusTodo, setActiveFocusTodo] = useState<TodoItem | null>(null);
  const [focusTimerLeft, setFocusTimerLeft] = useState(1500); // in seconds
  const [isFocusTimerRunning, setIsFocusTimerRunning] = useState(false);
  const [hasCompletedFocusSession, setHasCompletedFocusSession] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const focusIntervalRef = useRef<any>(null);

  // Theme support local fallback helpers
  const primaryColor = themeConfig.numColor || '#007AFF';
  const headerTextColor = themeConfig.textPrimary || '#111111';
  const subtitleTextColor = themeConfig.textSecondary || '#8E8E93';

  // 2. Multi-tab synchronization and listener
  useEffect(() => {
    window.localStorage.setItem('app_todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    window.localStorage.setItem('app_todo_config', JSON.stringify(todoConfig));
  }, [todoConfig]);

  useEffect(() => {
    const handleTodosChangeFromScheduler = () => {
      try {
        const saved = window.localStorage.getItem('app_todos');
        if (saved) {
          setTodos(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Failed to sync todos storage:', err);
      }
    };
    window.addEventListener('app_todos_changed', handleTodosChangeFromScheduler);
    return () => {
      window.removeEventListener('app_todos_changed', handleTodosChangeFromScheduler);
    };
  }, []);

  // Sync to chat messaging layer
  const getFormatTime = () => {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const getCustomQuote = (type: 'add' | 'complete' | 'overdue', customText?: string) => {
    // 1. Check if specific card system group exists (e.g., Todo添加, Todo完成, Todo逾期)
    let groupPrefix = '';
    if (type === 'add') groupPrefix = 'Todo添加';
    if (type === 'complete') groupPrefix = 'Todo完成';
    if (type === 'overdue') groupPrefix = 'Todo逾期';

    let customGroup = cardGroups.find(g => g.name === groupPrefix || g.name === `${groupPrefix}回复`);
    
    if (customGroup && customGroup.cards.length > 0) {
      return customGroup.cards[Math.floor(Math.random() * customGroup.cards.length)];
    }

    // 2. Check local customized configured arrays (has highest priority next to system group)
    let configuredQuotes = todoConfig.addQuotes;
    if (type === 'complete') configuredQuotes = todoConfig.completeQuotes;
    if (type === 'overdue') configuredQuotes = todoConfig.overdueQuotes;

    if (configuredQuotes && configuredQuotes.length > 0) {
      return configuredQuotes[Math.floor(Math.random() * configuredQuotes.length)];
    }

    // 3. Fallback to generic "Todo回复" system group if configured array is not available
    let genericGroup = cardGroups.find(g => g.name === 'Todo回复');
    if (genericGroup && genericGroup.cards.length > 0) {
      if (type === 'complete') {
        const complFallbacks = genericGroup.cards.filter(c => c.includes('不错') || c.includes('辛苦') || c.includes('棒') || c.includes('抱抱') || c.includes('摸摸'));
        if (complFallbacks.length > 0) {
          return complFallbacks[Math.floor(Math.random() * complFallbacks.length)];
        }
      } else if (type === 'add') {
        const addFallbacks = genericGroup.cards.filter(c => c.includes('记') || c.includes('小本本') || c.includes('写下') || c.includes('盯'));
        if (addFallbacks.length > 0) {
          return addFallbacks[Math.floor(Math.random() * addFallbacks.length)];
        }
      }
      return genericGroup.cards[Math.floor(Math.random() * genericGroup.cards.length)];
    }

    // 4. Default fallback
    const fallbackQuotes = type === 'complete' ? DEFAULT_TODO_CONFIG.completeQuotes : 
                           type === 'overdue' ? DEFAULT_TODO_CONFIG.overdueQuotes : 
                           DEFAULT_TODO_CONFIG.addQuotes;
    return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
  };

  const syncToChat = async (actionText: string, quoteType: 'add' | 'complete' | 'overdue') => {
    try {
      let msgs = await get('app_chatMessages');
      if (!msgs) {
        const local = window.localStorage.getItem('app_chatMessages');
        msgs = local ? JSON.parse(local) : [];
      }
      if (!Array.isArray(msgs)) msgs = [];
      
      const myMsg = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
        sender: 'me',
        type: 'text',
        content: actionText,
        time: getFormatTime()
      };
      
      const quote = getCustomQuote(quoteType);
      const theirMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'them',
        type: 'text',
        content: quote,
        time: getFormatTime()
      };
      
      const updatedMsgs = [...msgs, myMsg, theirMsg];
      await set('app_chatMessages', updatedMsgs);
      
      // Dispatch channel notification
      window.dispatchEvent(new CustomEvent('idbStateChanged', { 
        detail: { key: 'app_chatMessages', newValue: updatedMsgs } 
      }));
    } catch (e) {
      console.error('Error syncing task to chat:', e);
    }
  };

  // Checking overdue on load
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const overdueCount = todos.filter(t => !t.completed && t.dueDate && t.dueDate < today).length;
    if (overdueCount > 0) {
      syncToChat(`[提醒] 有 ${overdueCount} 个任务已逾期未完成哦`, 'overdue');
    }
  }, []);

  // 3. Task Management Clicks
  const handleAddTask = () => {
    if (!inputValue.trim()) return;
    
    // Auto format time
    const todayStr = new Date().toISOString().split('T')[0];

    const newTodo: TodoItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      text: inputValue.trim(),
      completed: false,
      dueDate: dueDate || null,
      createdAt: Date.now(),
      priority,
      type: taskType,
      focusDuration: taskType === 'single' ? focusMinutes : undefined,
      reminderTime: taskType === 'daily' ? reminderTime : undefined,
      templateQuote: taskType === 'daily' ? (customDailyQuote.trim() || undefined) : undefined,
      lastResetDate: taskType === 'daily' ? todayStr : undefined,
      currentProgress: taskType === 'long_term' ? 0 : undefined,
      totalProgress: taskType === 'long_term' ? targetProgress : undefined
    };

    setTodos([newTodo, ...todos]);
    setInputValue('');
    setDueDate('');
    setPriority('medium');
    setCustomDailyQuote('');
    setShowAddModal(false);
    
    const displayTypeMap = {
      single: '【专注任务】',
      daily: '【日常提醒】',
      long_term: '【长线任务】'
    };
    syncToChat(`[添加待办] ${displayTypeMap[taskType]}${newTodo.text}`, 'add');
  };

  const toggleComplete = (id: string, currentlyCompleted: boolean) => {
    const matched = todos.find(t => t.id === id);
    if (!matched) return;

    if (matched.type === 'long_term') {
      const isFinishing = !currentlyCompleted;
      setTodos(todos.map(t => {
        if (t.id === id) {
          return { 
            ...t, 
            completed: isFinishing,
            currentProgress: isFinishing ? (t.totalProgress || 100) : 0
          };
        }
        return t;
      }));
      if (isFinishing) {
        syncToChat(`[长线任务达成] ${matched.text} 一步一个脚印，太厉害了！`, 'complete');
      }
    } else {
      setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
      if (!currentlyCompleted) {
        syncToChat(`[完成待办] ${matched.text}`, 'complete');
      }
    }
  };

  const handleDelete = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  // Longterm progress modifier
  const updateLongTermProgress = (id: string, newVal: number) => {
    setTodos(prev => prev.map(t => {
      if (t.id === id) {
        const total = t.totalProgress || 100;
        const boundedVal = Math.max(0, Math.min(total, newVal));
        const isFinishing = boundedVal >= total;
        
        if (isFinishing && !t.completed) {
          // Delayed sync list to ensure chat works cleanly
          setTimeout(() => {
            syncToChat(`[积累达成] 长线「${t.text}」进度已推至100%！`, 'complete');
          }, 300);
        }
        return {
          ...t,
          currentProgress: boundedVal,
          completed: isFinishing
        };
      }
      return t;
    }));
  };

  // 4. Focus Mode Logic
  const startFocusSession = (todo: TodoItem) => {
    setActiveFocusTodo(todo);
    const totalSecs = (todo.focusDuration || todoConfig.defaultFocusDuration) * 60;
    setFocusTimerLeft(totalSecs);
    setIsFocusTimerRunning(true);
    setHasCompletedFocusSession(false);
  };

  useEffect(() => {
    if (isFocusTimerRunning && activeFocusTodo) {
      focusIntervalRef.current = setInterval(() => {
        setFocusTimerLeft(prev => {
          if (prev <= 1) {
            // Completed!
            clearInterval(focusIntervalRef.current);
            setIsFocusTimerRunning(false);
            setHasCompletedFocusSession(true);
            completeFocusTask(activeFocusTodo.id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (focusIntervalRef.current) clearInterval(focusIntervalRef.current);
    }

    return () => {
      if (focusIntervalRef.current) clearInterval(focusIntervalRef.current);
    };
  }, [isFocusTimerRunning, activeFocusTodo]);

  const completeFocusTask = (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    // Mark as completed
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: true } : t));
    
    // Add text sync to IndexedDB
    syncToChat(`[专注好棒] 完成了「${todo.text}」的专注陪伴！非常自律！`, 'complete');
  };

  const closeFocusSession = () => {
    setIsFocusTimerRunning(false);
    setActiveFocusTodo(null);
    setHasCompletedFocusSession(false);
    setConfirmAbandon(false);
  };

  // 5. Select & clean batch
  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    setTodos(todos.filter(t => !selectedIds.has(t.id)));
    syncToChat(`[批量管理] 整理移除了 ${selectedIds.size} 项任务记录`, 'complete');
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  // 6. Config Helper functions
  const handleAddNewQuote = (type: 'add' | 'complete' | 'overdue') => {
    const input = prompt('请输入你要添加的新回复内容:');
    if (!input || !input.trim()) return;

    setTodoConfig(prev => {
      const next = { ...prev };
      if (type === 'add') next.addQuotes = [...next.addQuotes, input.trim()];
      if (type === 'complete') next.completeQuotes = [...next.completeQuotes, input.trim()];
      if (type === 'overdue') next.overdueQuotes = [...next.overdueQuotes, input.trim()];
      return next;
    });
  };

  const handleRemoveQuote = (type: 'add' | 'complete' | 'overdue', index: number) => {
    setTodoConfig(prev => {
      const next = { ...prev };
      if (type === 'add') next.addQuotes = next.addQuotes.filter((_, i) => i !== index);
      if (type === 'complete') next.completeQuotes = next.completeQuotes.filter((_, i) => i !== index);
      if (type === 'overdue') next.overdueQuotes = next.overdueQuotes.filter((_, i) => i !== index);
      return next;
    });
  };

  // Filter lists based on tab
  const filteredTodos = todos.filter(t => {
    if (activeTab === 'all') return true;
    return t.type === activeTab;
  });

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden text-[14px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: themeConfig.bg || '#F2F2F7' }}>
      
      {/* Title Header */}
      <div 
        className="w-full flex items-center justify-between px-3 pb-2 bg-white/30 sticky top-0 z-20 border-b border-[#c6c6c8]/20 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.02)] animate-fade-in"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
      >
        <button onClick={onClose} className="p-2 -ml-2 active:opacity-50 transition-opacity">
          <ChevronLeft size={24} style={{ color: headerTextColor }} />
        </button>
        <h1 className="text-[17px] font-semibold" style={{ color: headerTextColor }}>待办与专注陪伴</h1>
        
        <div className="flex items-center gap-1.5 z-30">
          <button 
            onClick={() => setShowConfigModal(true)} 
            className="p-1.5 text-gray-600 active:opacity-50 transition-opacity"
            title="配置中心"
          >
            <Settings size={20} style={{ color: headerTextColor }} />
          </button>
          <button 
            onClick={() => {
              if (isSelectMode) {
                setIsSelectMode(false);
                setSelectedIds(new Set());
              } else {
                setIsSelectMode(true);
              }
            }} 
            className="text-[15px] px-2 py-1 select-none font-medium text-gray-800 active:opacity-50 transition-opacity"
          >
            {isSelectMode ? '取消' : '管理'}
          </button>
        </div>
      </div>

      {/* Tabs Control */}
      {!isSelectMode && (
        <div className="px-4 py-2.5 bg-white/10 shrink-0">
          <div className="flex bg-[#E5E5EA]/80 backdrop-blur-sm p-[2.5px] rounded-[10px] text-xs">
            {(['all', 'single', 'daily', 'long_term'] as const).map((tab) => {
              const tabLabelMap = {
                all: '全部',
                single: '专注任务',
                daily: '每日提醒',
                long_term: '长线积累'
              };
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 text-center py-1.5 rounded-[8px] font-medium transition-all ${
                    active ? 'bg-white text-[#333] shadow-sm font-semibold' : 'text-[#8E8E93] hover:text-[#555]'
                  }`}
                >
                  {tabLabelMap[tab]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main List Scroller */}
      <div className="flex-1 overflow-y-auto px-4 pt-1 pb-24">
        {filteredTodos.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center opacity-40 text-center px-6">
            <BookOpen size={44} className="mb-2 text-gray-400" />
            <p className="text-[13px]">当前分类没有任务安排哦</p>
            <p className="text-[11px] mt-1 text-gray-500">点下方加号创建各种陪伴维度事项吧~</p>
          </div>
        ) : (
          <div className="space-y-3 pb-8 pt-2">
            <AnimatePresence initial={false}>
              {filteredTodos.map((todo) => {
                const isLt = todo.type === 'long_term';
                const isDl = todo.type === 'daily';
                const isSg = todo.type === 'single';
                const overdue = !todo.completed && todo.dueDate && todo.dueDate < new Date().toISOString().split('T')[0];
                
                return (
                  <motion.div
                    key={todo.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`rounded-[16px] p-4 flex flex-col shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-stone-200/40 group relative overflow-hidden transition-all ${
                      isSg ? 'bg-[#FAF8F5]' : 
                      isDl ? 'bg-[#F0F4F8]' : 
                      'bg-[#FAF0F2]'
                    }`}
                  >

                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1 min-w-0">
                        {/* Custom Large Round Checkbox */}
                        <button 
                          className={`w-[22px] h-[22px] rounded-full border mr-3 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                            isSelectMode 
                              ? (selectedIds.has(todo.id) ? 'border-transparent text-white' : 'border-stone-300')
                              : (todo.completed ? 'border-transparent text-white' : 'border-stone-300 hover:border-stone-450')
                          }`}
                          style={{ 
                            backgroundColor: (isSelectMode && selectedIds.has(todo.id)) || (!isSelectMode && todo.completed) ? primaryColor : 'transparent',
                            borderColor: ((isSelectMode && selectedIds.has(todo.id)) || (!isSelectMode && todo.completed)) ? primaryColor : '#D1D1D6'
                          }}
                          onClick={() => {
                            if (isSelectMode) {
                              const newSet = new Set(selectedIds);
                              if (newSet.has(todo.id)) newSet.delete(todo.id);
                              else newSet.add(todo.id);
                              setSelectedIds(newSet);
                            } else {
                              toggleComplete(todo.id, todo.completed);
                            }
                          }}
                        >
                          {((isSelectMode && selectedIds.has(todo.id)) || (!isSelectMode && todo.completed)) && (
                            <Check size={12} color="#FFF" strokeWidth={3.5}/>
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p 
                            className={`text-[14px] font-medium transition-all leading-snug whitespace-pre-wrap break-words ${
                              (todo.completed && !isSelectMode) ? 'line-through text-stone-400 opacity-50' : 'text-stone-850'
                            }`}
                          >
                            {todo.text}
                          </p>

                          {/* Detail Badges depending on types */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {/* Type Label */}
                            <span className={`text-[9.5px] font-medium px-2 py-0.5 rounded-md border ${
                              isSg ? 'bg-amber-50/60 border-amber-200/30 text-amber-800/85' : 
                              isDl ? 'bg-indigo-50/60 border-indigo-200/30 text-indigo-800/85' : 
                              'bg-emerald-50/60 border-emerald-200/30 text-emerald-800/85'
                            }`}>
                              {isSg ? '专注陪伴' : isDl ? '每日习惯' : '长期积累'}
                            </span>

                            {/* Focus Length Indicator */}
                            {isSg && (
                              <span className="text-[10px] text-stone-500 bg-stone-100/70 border border-stone-200/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock size={10} className="text-stone-400" />
                                {todo.focusDuration || todoConfig.defaultFocusDuration} 分钟
                              </span>
                            )}

                            {/* Time Trigger Clock */}
                            {isDl && (
                              <span className="text-[10px] text-stone-500 bg-stone-100/70 border border-stone-200/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock size={10} className="text-stone-400" />
                                {todo.reminderTime || '09:00'} 提醒
                              </span>
                            )}

                            {/* Template Quote indicator */}
                            {isDl && todo.templateQuote && (
                              <span className="text-[10px] text-stone-500 bg-stone-100/70 border border-stone-200/30 px-2 py-0.5 rounded-md max-w-[160px] truncate" title={todo.templateQuote}>
                                💬 "{todo.templateQuote}"
                              </span>
                            )}

                            {/* Date Overdue warning */}
                            {todo.dueDate && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                overdue 
                                  ? 'bg-rose-50 border-rose-200/35 text-rose-700/90 font-medium' 
                                  : 'bg-stone-100/70 border-stone-200/30 text-stone-500'
                              }`}>
                                <Calendar size={10} />
                                {todo.dueDate} {overdue ? '(逾期)' : ''}
                              </span>
                            )}

                            {/* Priority Indicator */}
                            <span className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                              todo.priority === 'high' ? 'bg-rose-50/60 border-rose-200/30 text-rose-700/80' :
                              todo.priority === 'medium' ? 'bg-amber-50/60 border-amber-200/30 text-amber-700/80' :
                              'bg-stone-50 border border-stone-200/40 text-stone-500'
                            }`}>
                              {todo.priority === 'high' ? '高优先级' : todo.priority === 'medium' ? '中优先级' : '低优先级'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action buttons */}
                      {!isSelectMode && (
                        <div className="flex items-center shrink-0 ml-2">
                          {isSg && !todo.completed && (
                            <button 
                              onClick={() => startFocusSession(todo)}
                              style={{ backgroundColor: primaryColor }}
                              className="px-2.5 py-1 text-xs font-semibold rounded-full flex items-center gap-1 text-white shadow-sm hover:opacity-90 active:scale-95 transition-all mr-1.5"
                            >
                              <Play size={10} fill="white" />
                              专注
                            </button>
                          )}
                          <button 
                            onClick={() => handleDelete(todo.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-500 hover:bg-stone-100/60 rounded-full transition-all"
                            title="删除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Progress slider for long-term task */}
                    {isLt && (
                      <div className="mt-4 pt-3 border-t border-stone-100">
                        <div className="flex justify-between items-center mb-2 text-[11px] font-medium text-stone-500">
                          <span>目前进度:</span>
                          <span className="text-stone-700 font-semibold">
                            {todo.currentProgress || 0} / {todo.totalProgress || 100} 
                            ({Math.round(((todo.currentProgress || 0) / (todo.totalProgress || 100)) * 100)}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="range"
                            min="0"
                            max={todo.totalProgress || 100}
                            value={todo.currentProgress || 0}
                            onChange={(e) => updateLongTermProgress(todo.id, parseInt(e.target.value))}
                            style={{ accentColor: primaryColor }}
                            className="flex-1 h-1 bg-stone-100 rounded-lg cursor-pointer"
                          />
                          <div className="flex gap-1 shrink-0">
                            <button 
                              onClick={() => updateLongTermProgress(todo.id, (todo.currentProgress || 0) - 5)}
                              className="w-7 h-7 bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/50 rounded-md text-[11px] font-medium flex items-center justify-center active:scale-95 transition-colors"
                            >
                              -5
                            </button>
                            <button 
                              onClick={() => updateLongTermProgress(todo.id, (todo.currentProgress || 0) + 5)}
                              className="w-7 h-7 bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/50 rounded-md text-[11px] font-medium flex items-center justify-center active:scale-95 transition-colors"
                            >
                              +5
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Floating Add Trigger Button */}
      {!isSelectMode && (
        <motion.button 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute bottom-[calc(2.5rem+env(safe-area-inset-bottom))] right-6 w-[54px] h-[54px] rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.15)] flex items-center justify-center text-white active:scale-95 transition-transform z-30"
          onClick={() => setShowAddModal(true)}
          style={{ backgroundColor: primaryColor }}
        >
          <Plus size={26} />
        </motion.button>
      )}

      {/* Batch Select Actions Panel */}
      <AnimatePresence>
        {isSelectMode && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] z-30"
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[13px] text-gray-500 font-medium">已选择 {selectedIds.size} 项</span>
                <button 
                  onClick={() => {
                    const complIds = todos.filter(t => t.completed).map(t => t.id);
                    setSelectedIds(new Set(complIds));
                  }}
                  className="text-xs text-left font-semibold active:opacity-60"
                  style={{ color: primaryColor }}
                >
                  一键选择已完成
                </button>
              </div>
              
              <button 
                onClick={handleBatchDelete}
                disabled={selectedIds.size === 0}
                className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-50"
                style={{ 
                  backgroundColor: selectedIds.size > 0 ? '#FF3B30' : '#E5E5EA', 
                  color: selectedIds.size > 0 ? '#FFF' : '#8E8E93' 
                }}
              >
                直接删除 {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Creation Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 px-0 sm:px-4">
            <motion.div 
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="sm:rounded-[24px] rounded-t-[24px] w-full max-w-[420px] flex flex-col overflow-hidden max-h-[85vh] bg-white text-gray-800 shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 flex-shrink-0">
                <button onClick={() => setShowAddModal(false)} className="text-[14px] text-gray-500 active:opacity-50">取消</button>
                <h3 className="text-[16px] font-semibold text-gray-800">新建日程陪伴</h3>
                <button 
                  onClick={handleAddTask} 
                  className="text-[14px] font-semibold active:opacity-50 transition-opacity" 
                  disabled={!inputValue.trim()} 
                  style={{ color: inputValue.trim() ? primaryColor : '#8E8E93' }}
                >
                  添加
                </button>
              </div>

              {/* Form Scrollable */}
              <div className="p-5 space-y-4 overflow-y-auto bg-gray-50/50">
                
                {/* 1. Dimension Picker */}
                <div className="bg-white p-3 rounded-[14px] shadow-sm border border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 block mb-2">选择陪同任务模式</span>
                  <div className="flex p-0.5 bg-gray-100 rounded-lg text-xs">
                    {(['single', 'daily', 'long_term'] as const).map(type => {
                      const typeLabel = {
                        single: '单次专注',
                        daily: '每日提醒',
                        long_term: '长线积累'
                      };
                      const active = taskType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setTaskType(type)}
                          className={`flex-1 py-1.5 rounded-md font-medium transition-all ${
                            active ? 'bg-white text-gray-800 shadow-sm font-semibold' : 'text-gray-400'
                          }`}
                        >
                          {typeLabel[type]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Text Input */}
                <div className="bg-white rounded-[14px] overflow-hidden shadow-sm border border-gray-100 p-3">
                  <span className="text-xs font-semibold text-gray-400 block mb-1">写下陪伴内容</span>
                  <textarea
                    className="w-full bg-transparent text-[14px] text-gray-800 outline-none min-h-[70px] resize-none placeholder:text-gray-300"
                    placeholder={
                      taskType === 'single' ? "要做什么专注任务呢，比如看书、复习..." :
                      taskType === 'daily' ? "比如按时吃药、喝水、早睡打卡哦..." :
                      "写下要长期慢慢积累的目标，比如写稿3万字、跑步50公里..."
                    }
                    autoFocus
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </div>

                {/* 3. Parameter Inputs based on chosen type */}
                {taskType === 'single' && (
                  <div className="bg-white rounded-[14px] p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-semibold text-gray-800">定制专注时长</span>
                      <span className="text-xs text-gray-400">设定番茄钟倒计时长</span>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                      <button 
                        type="button"
                        onClick={() => setFocusMinutes(prev => Math.max(1, prev - 5))}
                        className="w-8 h-8 font-semibold text-gray-700 bg-white rounded flex items-center justify-center active:scale-95 shadow-sm"
                      >
                        -5
                      </button>
                      <input 
                        type="number"
                        className="w-12 text-center text-sm bg-transparent outline-none font-bold text-gray-800"
                        value={focusMinutes}
                        onChange={(e) => setFocusMinutes(Math.max(1, parseInt(e.target.value) || 25))}
                      />
                      <span className="text-xs text-gray-500 pr-1 select-none">分</span>
                      <button 
                        type="button"
                        onClick={() => setFocusMinutes(prev => Math.min(180, prev + 5))}
                        className="w-8 h-8 font-semibold text-gray-700 bg-white rounded flex items-center justify-center active:scale-95 shadow-sm"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                )}

                {taskType === 'daily' && (
                  <div className="space-y-3">
                    {/* Time Picker */}
                    <div className="bg-white rounded-[14px] p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[14px] font-semibold text-gray-800">提醒触发时间</span>
                        <span className="text-xs text-gray-400">每天此时间在聊天发送</span>
                      </div>
                      <input 
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="text-[15px] font-semibold text-gray-700 border border-gray-200 rounded-md p-1 bg-gray-50"
                      />
                    </div>

                    {/* Custom Prompt template */}
                    <div className="bg-white rounded-[14px] p-4 shadow-sm border border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[14px] font-semibold text-gray-800">自定义未婚夫提醒词</span>
                        <span className="text-[10px] text-[#5856D6] font-medium">支持 {`{text}`} 占位符</span>
                      </div>
                      <textarea
                        className="w-full bg-transparent text-[13px] text-gray-700 outline-none min-h-[50px] resize-none placeholder:text-gray-300 border border-gray-100 p-2 rounded-lg bg-gray-50/50"
                        placeholder="留空即采用全局默认回复。配置示例：『别忙太晚，要按时 {text} 哦，等你回家~』"
                        value={customDailyQuote}
                        onChange={(e) => setCustomDailyQuote(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {taskType === 'long_term' && (
                  <div className="bg-white rounded-[14px] p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-semibold text-gray-800">目标进度上限</span>
                      <span className="text-xs text-gray-400">总共需要累积的指标值</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="number"
                        className="w-16 text-center border border-gray-200 text-sm p-1.5 rounded-lg bg-gray-50 font-semibold"
                        value={targetProgress}
                        onChange={(e) => setTargetProgress(Math.max(1, parseInt(e.target.value) || 100))}
                      />
                    </div>
                  </div>
                )}

                {/* 4. Common Properties: Date & Priority */}
                <div className="bg-white rounded-[14px] p-3 shadow-sm border border-gray-100 flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-gray-700 pl-1">截止日期</span>
                  <input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="text-[13px] text-gray-650 border border-gray-250 p-1 px-2 rounded-md outline-none bg-gray-50/50"
                  />
                </div>

                <div className="bg-white rounded-[14px] p-4 shadow-sm border border-gray-100">
                  <span className="text-xs font-semibold text-gray-400 block mb-2">优先级标签</span>
                  <div className="flex items-center gap-2">
                    {(['low', 'medium', 'high'] as const).map(p => {
                      const pLabel = { low: '低', medium: '中', high: '高' };
                      const active = priority === p;
                      const activeColors = {
                        low: 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/35',
                        medium: 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/35',
                        high: 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/35'
                      };
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            active ? activeColors[p] : 'bg-[#F2F2F7] text-gray-400 border-transparent'
                          }`}
                        >
                          {pLabel[p]}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Configuration Center sheet */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/50 px-0 sm:px-4">
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="bg-white sm:rounded-[24px] rounded-t-[24px] w-full max-w-[440px] flex flex-col overflow-hidden max-h-[90vh] shadow-xl text-gray-800"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 shrink-0">
                <span className="w-12"></span>
                <h3 className="text-base font-bold text-gray-800">待办个性化配置</h3>
                <button 
                  onClick={() => setShowConfigModal(false)}
                  className="px-2 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500 active:scale-95"
                >
                  完成
                </button>
              </div>

              {/* Scrollable Form */}
              <div className="p-5 overflow-y-auto space-y-4 bg-gray-50/50">
                
                {/* 1. Default parameters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2.5 flex items-center gap-1.5">
                    <Clock size={16} className="text-stone-400" />
                    默认专注陪伴时长
                  </h4>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range"
                      min="5" 
                      max="120"
                      step="5"
                      value={todoConfig.defaultFocusDuration}
                      style={{ accentColor: primaryColor }}
                      onChange={(e) => setTodoConfig(prev => ({ ...prev, defaultFocusDuration: parseInt(e.target.value) || 25 }))}
                      className="flex-1 cursor-pointer h-1 rounded-lg"
                    />
                    <span className="text-xs font-semibold text-stone-700 bg-stone-100 border border-stone-200/60 px-2 py-1 rounded-md">
                      {todoConfig.defaultFocusDuration} 分钟
                    </span>
                  </div>
                </div>

                {/* 2. Global Reminder template fallback */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <MessageSquare size={16} className="text-stone-400" />
                    每日默认提醒模板
                  </h4>
                  <p className="text-[11px] text-stone-400">每日定时发起的提醒，支持 <code>{`{text}`}</code> 占位符替代任务项。</p>
                  <textarea
                    className="w-full bg-stone-50/50 border border-stone-200/70 rounded-lg p-2.5 text-xs text-stone-700 outline-none focus:border-stone-400 focus:bg-white resize-none min-h-[60px] transition-colors"
                    value={todoConfig.dailyReminderFallbackQuote}
                    onChange={(e) => setTodoConfig(prev => ({ ...prev, dailyReminderFallbackQuote: e.target.value }))}
                  />
                </div>

                {/* 3. Add Quotes Config List */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-stone-100 mb-1">
                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-stone-400" />
                      添加任务时未婚夫回复
                    </h4>
                    <button 
                      onClick={() => handleAddNewQuote('add')}
                      className="text-stone-600 bg-stone-100 border border-stone-200/80 hover:bg-stone-200 hover:text-stone-800 text-xs font-semibold px-2.5 py-1 rounded-md transition-all active:scale-95"
                    >
                      + 新增
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pt-1">
                    {todoConfig.addQuotes.map((q, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-stone-50/60 p-2 rounded-lg border border-stone-200/30">
                        <span className="truncate flex-1 pr-3 text-stone-700">{q}</span>
                        <button 
                          onClick={() => handleRemoveQuote('add', idx)}
                          className="text-stone-400 hover:text-red-500 px-1 font-medium select-none text-[10px] transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Complete Quotes Config List */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-stone-100 mb-1">
                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                      <Heart size={14} className="text-stone-400" />
                      完成任务时未婚夫回复
                    </h4>
                    <button 
                      onClick={() => handleAddNewQuote('complete')}
                      className="text-stone-600 bg-stone-100 border border-stone-200/80 hover:bg-stone-200 hover:text-stone-800 text-xs font-semibold px-2.5 py-1 rounded-md transition-all active:scale-95"
                    >
                      + 新增
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pt-1">
                    {todoConfig.completeQuotes.map((q, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-stone-50/60 p-2 rounded-lg border border-stone-200/30">
                        <span className="truncate flex-1 pr-3 text-stone-700">{q}</span>
                        <button 
                          onClick={() => handleRemoveQuote('complete', idx)}
                          className="text-stone-400 hover:text-red-500 px-1 font-medium select-none text-[10px] transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Overdue Quotes Config List */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-stone-100 mb-1">
                    <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-stone-400" />
                      未做逾期时未婚夫碎碎念
                    </h4>
                    <button 
                      onClick={() => handleAddNewQuote('overdue')}
                      className="text-stone-600 bg-stone-100 border border-stone-200/80 hover:bg-stone-200 hover:text-stone-800 text-xs font-semibold px-2.5 py-1 rounded-md transition-all active:scale-95"
                    >
                      + 新增
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pt-1">
                    {todoConfig.overdueQuotes.map((q, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-stone-50/60 p-2 rounded-lg border border-stone-200/30">
                        <span className="truncate flex-1 pr-3 text-stone-700">{q}</span>
                        <button 
                          onClick={() => handleRemoveQuote('overdue', idx)}
                          className="text-stone-400 hover:text-red-500 px-1 font-medium select-none text-[10px] transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============ FOCUS MODE FULLSCREEN VIEW ============ */}
      <AnimatePresence>
        {activeFocusTodo && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col justify-between p-6 overflow-hidden select-none bg-[#0E0E10] text-white"
          >
            {/* Top Close / Back Header */}
            <div className="w-full flex items-center justify-between z-10 pt-4">
              <button 
                onClick={closeFocusSession}
                className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-full transition-all active:scale-90"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/50">
                <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-pulse" />
                <span>专注中</span>
              </div>
              <div className="w-10"></div>
            </div>

            {/* Central Master Clock */}
            <div className="flex-1 flex flex-col items-center justify-center text-center z-10 px-4">
              {!hasCompletedFocusSession ? (
                <>
                  <h2 className="text-lg font-medium tracking-wide text-white/80 mb-2 max-w-[280px]">
                    {activeFocusTodo.text}
                  </h2>

                  {/* Gigantic Typographic Timer */}
                  <div className="font-mono font-extralight select-none text-[84px] tracking-tighter leading-none text-white/95 my-8">
                    {formatTimer(focusTimerLeft)}
                  </div>

                  {/* Character Companion Avatar and bubble */}
                  <div className="mt-10 flex flex-col items-center gap-3 max-w-[260px]">
                    <img 
                      src={avatar2} 
                      alt={name2} 
                      className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-sm shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <p className="text-xs text-white/50 text-center leading-relaxed font-light">
                      "{todoConfig.completeQuotes[Math.floor((activeFocusTodo.createdAt || 0) % todoConfig.completeQuotes.length)] || "深呼吸，我会静静地守望着你完成哦。"}"
                    </p>
                  </div>
                </>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center mb-3">
                    <Check size={20} className="text-white/80" strokeWidth={2} />
                  </div>
                  
                  <h2 className="text-base font-medium tracking-wide text-white/90">专注陪伴圆满结束</h2>
                  <p className="text-xs text-white/40">已自动标记为完成</p>
                  
                  <p className="text-xs text-white/50 max-w-[240px] text-center mt-6 italic font-light">
                    “辛苦啦，休息一下，去喝口水吧。”
                  </p>
                </motion.div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="w-full flex flex-col gap-3.5 z-10 pb-8 shrink-0">
              {!hasCompletedFocusSession ? (
                <>
                  {/* Duration customizer on-the-fly */}
                  <div className="flex justify-center items-center gap-3 bg-white/5 p-1 px-3 rounded-full border border-white/5 max-w-[180px] mx-auto mb-3">
                    <button 
                      onClick={() => {
                        setFocusTimerLeft(prev => Math.max(60, prev - 300));
                      }}
                      className="text-[11px] text-white/40 hover:text-white/80 active:scale-95 transition-all font-medium py-0.5 px-1.5"
                    >
                      -5分
                    </button>
                    <span className="text-[11px] text-white/20 select-none">|</span>
                    <button 
                      onClick={() => {
                        setFocusTimerLeft(prev => Math.min(10800, prev + 300));
                      }}
                      className="text-[11px] text-white/40 hover:text-white/80 active:scale-95 transition-all font-medium py-0.5 px-1.5"
                    >
                      +5分
                    </button>
                  </div>

                  {/* Play / pause triggers */}
                  <div className="flex flex-col items-center justify-center gap-3">
                    <button 
                      onClick={() => setIsFocusTimerRunning(!isFocusTimerRunning)}
                      className={`px-10 py-3 rounded-full font-medium text-xs select-none tracking-wider flex items-center gap-2 transition-all active:scale-95 border ${
                        isFocusTimerRunning 
                          ? 'bg-transparent text-white border-white/25 hover:bg-white/5' 
                          : 'bg-white text-black border-transparent hover:bg-white/90'
                      }`}
                    >
                      {isFocusTimerRunning ? <Pause size={13} fill="currentColor" strokeWidth={0} /> : <Play size={13} fill="currentColor" strokeWidth={0} />}
                      <span>{isFocusTimerRunning ? '暂停计时' : '继续专注'}</span>
                    </button>

                    {confirmAbandon ? (
                      <div className="flex items-center gap-2.5 mt-1.5 animate-fade-in">
                        <button 
                          onClick={() => {
                            closeFocusSession();
                          }}
                          className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1 bg-red-500/10 rounded-full border border-red-500/25 active:scale-95 transition-all"
                        >
                          确认放弃并重置
                        </button>
                        <button 
                          onClick={() => setConfirmAbandon(false)}
                          className="text-xs text-white/55 hover:text-white/80 px-3 py-1 bg-white/5 rounded-full border border-white/10 active:scale-95 transition-all"
                        >
                          继续专注
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          setConfirmAbandon(true);
                        }}
                        className="text-xs text-white/40 hover:text-white/60 active:scale-95 transition-colors font-medium py-1.5"
                      >
                        中途放弃
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <button 
                  onClick={closeFocusSession}
                  className="px-14 py-3 bg-white text-black hover:bg-white/90 font-medium rounded-full text-xs tracking-wider active:scale-95 transition-all mx-auto"
                >
                  继续其他日程计划
                </button>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
