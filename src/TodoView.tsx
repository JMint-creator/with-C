import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Check, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { get, set } from 'idb-keyval';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  dueDate: string | null;
  createdAt: number;
  priority: 'high' | 'medium' | 'low';
}

interface TodoViewProps {
  onClose: () => void;
  themeConfig: any;
  avatar2: string;
  name2: string;
  cardGroups: { id: string, name: string, cards: string[] }[];
}

const ADD_QUOTES = [
  "记进小本本啦！",
  "我会盯着大家完成的~",
  "不要太累哦，但也要加油！",
  "既然写下来了就一定要做哦！",
];

const COMPLETE_QUOTES = [
  "好棒！摸摸头~",
  "辛苦啦，奖励一个抱抱！",
  "真厉害！今天也是超级棒的一天！",
  "做完啦？要不要休息一下~",
];

const OVERDUE_QUOTES = [
  "怎么还没完成呀...",
  "遇到困难了吗？要帮忙吗？",
  "时间到了哦，快去完成吧！",
];

export function TodoView({ onClose, themeConfig, avatar2, name2, cardGroups }: TodoViewProps) {
  const [todos, setTodos] = useState<TodoItem[]>(() => {
    try {
      const saved = window.localStorage.getItem('app_todos');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [inputValue, setInputValue] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    window.localStorage.setItem('app_todos', JSON.stringify(todos));
  }, [todos]);

  const getFormatTime = () => {
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const syncToChat = async (actionText: string, quoteType: 'add' | 'complete' | 'overdue') => {
    try {
        let msgs = await get('app_chatMessages');
        if (!msgs) {
            try {
                const local = window.localStorage.getItem('app_chatMessages');
                msgs = local ? JSON.parse(local) : [];
            } catch(e) {
                msgs = [];
            }
        }
        
        const myMsg = {
           id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
           sender: 'me',
           type: 'text',
           content: actionText,
           time: getFormatTime()
        };
        const quote = getQuote(quoteType);
        const theirMsg = {
           id: (Date.now() + 1).toString(),
           sender: 'them',
           type: 'text',
           content: quote,
           time: getFormatTime()
        };
        await set('app_chatMessages', [...msgs, myMsg, theirMsg]);
    } catch(e) {}
  };

  const getQuote = (type: 'add' | 'complete' | 'overdue') => {
    let groupPrefix = '';
    if (type === 'add') groupPrefix = 'Todo添加';
    if (type === 'complete') groupPrefix = 'Todo完成';
    if (type === 'overdue') groupPrefix = 'Todo逾期';

    // check if user has custom group
    let customGroup = cardGroups.find(g => g.name === groupPrefix || g.name === `${groupPrefix}回复` || g.name === 'Todo回复');
    
    if (customGroup && customGroup.cards.length > 0) {
      return customGroup.cards[Math.floor(Math.random() * customGroup.cards.length)];
    }

    // fallback
    let fallbackQuotes = ADD_QUOTES;
    if (type === 'complete') fallbackQuotes = COMPLETE_QUOTES;
    if (type === 'overdue') fallbackQuotes = OVERDUE_QUOTES;
    return fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
  };

  useEffect(() => {
    // When opened, if we have overdue tasks, mention it!
    const today = new Date().toISOString().split('T')[0];
    const overdueCount = todos.filter(t => !t.completed && t.dueDate && t.dueDate < today).length;
    if (overdueCount > 0) {
      syncToChat(`[提醒] 有 ${overdueCount} 个任务已逾期未完成~`, 'overdue');
    }
  }, []);

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    const newTodo: TodoItem = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      text: inputValue.trim(),
      completed: false,
      dueDate: dueDate || null,
      createdAt: Date.now(),
      priority,
    };
    setTodos([newTodo, ...todos]);
    setInputValue('');
    setDueDate('');
    setPriority('medium');
    setShowAddModal(false);
    syncToChat(`[添加待办] ${inputValue.trim()}`, 'add');
  };

  const toggleComplete = (id: string, currentlyCompleted: boolean) => {
    const todo = todos.find(t => t.id === id);
    setTodos(todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    if (!currentlyCompleted && todo) {
      syncToChat(`[完成待办] ${todo.text}`, 'complete');
    }
  };

  const handleDelete = (id: string, completed: boolean) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const toggleSelectMode = () => {
    if (isSelectMode) {
      setIsSelectMode(false);
      setSelectedIds(new Set());
    } else {
      setIsSelectMode(true);
    }
  };

  const toggleTaskSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };
  
  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    setTodos(todos.filter(t => !selectedIds.has(t.id)));
    syncToChat(`[批量清理] 清理了 ${selectedIds.size} 个任务`, 'complete');
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateString < today;
  };

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden text-[14px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', backgroundColor: themeConfig.bg || '#F2F2F7' }}>
      {/* Header */}
      <div 
        className="w-full flex items-center justify-between px-3 pb-3 bg-white/30 sticky top-0 z-20 border-b border-[#c6c6c8]/20 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
      >
        <button onClick={onClose} className="p-2 -ml-2 active:opacity-50 transition-opacity">
          <ChevronLeft size={24} style={{color: themeConfig.textPrimary}} />
        </button>
        <h1 className="text-[17px] font-medium" style={{color: themeConfig.textPrimary}}>待办事项</h1>
        <div className="w-[60px] flex justify-end">
          <button 
             onClick={toggleSelectMode} 
             className="text-[15px] font-medium active:opacity-50 transition-opacity"
             style={{color: themeConfig.textPrimary}}
          >
             {isSelectMode ? '取消' : '管理'}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {todos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40 pb-20">
             <Check size={48} className="mb-2" />
             <p>暂时没有任务哦，好好休息吧~</p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
             <AnimatePresence>
                {todos.map((todo, index) => {
                  const overdue = !todo.completed && isOverdue(todo.dueDate);
                  return (
                    <motion.div
                      key={`${todo.id}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-[16px] p-3 pl-4 pr-1 flex items-center shadow-[0_2px_8px_rgba(0,0,0,0.03)] group relative overflow-hidden"
                    >
                      {/* Priority Indicator */}
                      <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${
                          todo.priority === 'high' ? 'bg-[#FF3B30]' : 
                          todo.priority === 'medium' ? 'bg-[#FF9500]' : 
                          todo.priority === 'low' ? 'bg-[#34C759]' : 'bg-transparent'
                      }`} />

                      <button 
                        className={`w-[24px] h-[24px] rounded-full border-[1.5px] mr-3 flex items-center justify-center shrink-0 transition-colors ml-1 ${
                           isSelectMode 
                             ? (selectedIds.has(todo.id) ? 'border-transparent text-white' : 'border-[#C7C7CC]')
                             : (todo.completed ? 'border-transparent text-white' : 'border-[#C7C7CC] hover:border-transparent')
                        }`}
                        style={{ 
                           backgroundColor: (isSelectMode && selectedIds.has(todo.id)) || (!isSelectMode && todo.completed) ? (themeConfig.numColor || '#34C759') : 'transparent',
                           borderColor: ((isSelectMode && selectedIds.has(todo.id)) || (!isSelectMode && todo.completed)) ? (themeConfig.numColor || '#34C759') : '#C7C7CC'
                        }}
                        onClick={() => isSelectMode ? toggleTaskSelection(todo.id) : toggleComplete(todo.id, todo.completed)}
                      >
                         {!isSelectMode && todo.completed && <Check size={14} color="#FFF" strokeWidth={3}/>}
                         {isSelectMode && selectedIds.has(todo.id) && <Check size={14} color="#FFF" strokeWidth={3}/>}
                      </button>
                      <div 
                         className={`flex-1 min-w-0 mr-2 ${(todo.completed && !isSelectMode) ? 'opacity-40' : ''}`}
                         onClick={() => isSelectMode ? toggleTaskSelection(todo.id) : null}
                      >
                         <p className={`text-[15px] transition-all leading-snug whitespace-pre-wrap break-words ${todo.completed ? 'line-through text-[#8E8E93]' : 'text-[#333]'}`}>
                            {todo.text}
                         </p>
                         {(todo.dueDate || overdue) && (
                            <div className="flex items-center mt-1.5 text-[11px] gap-2 opacity-80">
                               {todo.dueDate && (
                                   <div className={`flex items-center gap-1 ${overdue ? 'text-[#FF3B30]' : 'text-[#8E8E93]'}`}>
                                      <Calendar size={11} />
                                      <span>{todo.dueDate}</span>
                                   </div>
                               )}
                               {overdue && (
                                   <div className="flex items-center gap-1 text-[#FF3B30] font-medium bg-[#FF3B30]/10 px-1.5 py-0.5 rounded-[4px]">
                                      <AlertCircle size={10} />
                                      <span>逾期</span>
                                   </div>
                               )}
                            </div>
                         )}
                      </div>
                      {!isSelectMode && (
                        <button 
                           className="p-3 bg-transparent text-[#FF3B30] opacity-0 group-hover:opacity-100 sm:opacity-50 transition-opacity"
                           onClick={() => handleDelete(todo.id, todo.completed)}
                        >
                           <Trash2 size={16} />
                        </button>
                      )}
                    </motion.div>
                  )
                })}
             </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <AnimatePresence>
        {!isSelectMode && (
          <motion.button 
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.8 }}
             className="absolute bottom-10 right-6 w-[56px] h-[56px] rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.15)] flex items-center justify-center text-white active:scale-95 transition-transform z-30"
             onClick={() => setShowAddModal(true)}
             style={{ backgroundColor: themeConfig.numColor || '#007AFF' }}
          >
             <Plus size={28} />
          </motion.button>
        )}
        
        {isSelectMode && (
          <motion.div
             initial={{ opacity: 0, y: 100 }}
             animate={{ opacity: 1, y: 0 }}
             exit={{ opacity: 0, y: 100 }}
             className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-[#c6c6c8]/30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-30"
             style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          >
             <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                   <span className="text-[14px] text-[#8e8e93] font-medium">已选择 {selectedIds.size} 项</span>
                   <button 
                     onClick={() => {
                        const completedIds = todos.filter(t => t.completed).map(t => t.id);
                        setSelectedIds(new Set(completedIds));
                     }}
                     className="text-[13px] font-medium active:opacity-50"
                     style={{ color: themeConfig.numColor || '#007AFF' }}
                   >
                     全选已完成
                   </button>
                </div>
                <button 
                  onClick={handleBatchDelete}
                  disabled={selectedIds.size === 0}
                  className="px-6 py-2.5 rounded-full text-[15px] font-semibold transition-colors disabled:opacity-50"
                  style={{ 
                    backgroundColor: selectedIds.size > 0 ? (themeConfig.numColor || '#FF3B30') : '#E5E5EA', 
                    color: selectedIds.size > 0 ? '#FFF' : '#8E8E93' 
                  }}
                >
                  删除 {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 px-0 sm:px-4">
             <motion.div 
               initial={{ opacity: 0, y: '100%' }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: '100%' }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="sm:rounded-[24px] rounded-t-[24px] w-full max-w-[400px] flex flex-col overflow-hidden max-h-[85vh]"
               style={{ backgroundColor: themeConfig.bg || '#F2F2F7' }}
             >
                <div className="flex items-center justify-between p-4 bg-white border-b border-[#E5E5EA]">
                   <button onClick={() => setShowAddModal(false)} className="text-[15px] text-[#8e8e93] active:opacity-50 transition-opacity">取消</button>
                   <h3 className="text-[16px] font-semibold text-[#111]">新建待办</h3>
                   <button onClick={handleAdd} className="text-[15px] font-semibold active:opacity-50 transition-opacity" disabled={!inputValue.trim()} style={{ color: themeConfig.numColor || '#007AFF' }}>添加</button>
                </div>
                <div className="p-4 space-y-4" style={{ backgroundColor: themeConfig.bg || '#F2F2F7' }}>
                   <div className="bg-white rounded-[10px] overflow-hidden shadow-sm">
                      <textarea
                         className="w-full bg-transparent p-4 text-[15px] text-[#333] outline-none min-h-[100px] resize-none placeholder:text-[#C7C7CC]"
                         placeholder="要记录什么任务呢..."
                         autoFocus
                         value={inputValue}
                         onChange={(e) => setInputValue(e.target.value)}
                      />
                   </div>
                   <div className="bg-white rounded-[10px] overflow-hidden shadow-sm flex items-center justify-between p-4">
                      <div className="flex items-center gap-2 text-[15px] text-[#333]">
                         <Calendar className="text-[#8E8E93]" size={20} />
                         <span>截止日期</span>
                      </div>
                      <input 
                         type="date" 
                         value={dueDate}
                         onChange={(e) => setDueDate(e.target.value)}
                         className="text-[14px] text-[#8E8E93] outline-none bg-transparent"
                      />
                   </div>
                   <div className="bg-white rounded-[10px] overflow-hidden shadow-sm flex flex-col p-4 mt-4">
                      <div className="flex items-center gap-2 text-[15px] text-[#333] mb-3">
                         <AlertCircle className="text-[#8E8E93]" size={20} />
                         <span>优先级</span>
                      </div>
                      <div className="flex items-center gap-2 w-full">
                         <button 
                           className={`flex-1 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors ${priority === 'low' ? 'bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/30' : 'bg-[#F2F2F7] text-[#8E8E93] border border-transparent'}`}
                           onClick={() => setPriority('low')}
                         >
                            低
                         </button>
                         <button 
                           className={`flex-1 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors ${priority === 'medium' ? 'bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/30' : 'bg-[#F2F2F7] text-[#8E8E93] border border-transparent'}`}
                           onClick={() => setPriority('medium')}
                         >
                            中
                         </button>
                         <button 
                           className={`flex-1 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors ${priority === 'high' ? 'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/30' : 'bg-[#F2F2F7] text-[#8E8E93] border border-transparent'}`}
                           onClick={() => setPriority('high')}
                         >
                            高
                         </button>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
