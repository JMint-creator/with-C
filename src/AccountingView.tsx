import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Plus, Wallet, Coffee, ShoppingBag, Car, Home, TrendingDown, TrendingUp, X, Heart, Smile, Gift } from 'lucide-react';
import { useIDBState } from './utils';

interface Record {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  note: string;
  timestamp: number;
}

const CATEGORIES = {
  expense: [
    { id: 'food', name: '餐饮美食', icon: Coffee },
    { id: 'shopping', name: '服饰购物', icon: ShoppingBag },
    { id: 'transport', name: '交通出行', icon: Car },
    { id: 'housing', name: '居家生活', icon: Home },
    { id: 'entertainment', name: '休闲娱乐', icon: Smile },
  ],
  income: [
    { id: 'salary', name: '工资收入', icon: Wallet },
    { id: 'gift', name: '收红包', icon: Gift },
    { id: 'other', name: '其他收入', icon: TrendingUp },
  ]
};

export function AccountingView({ 
  onClose, 
  themeConfig,
  name1,
  name2,
  avatar2,
  cardGroups
}: { 
  onClose: () => void, 
  themeConfig: any,
  name1: string,
  name2: string,
  avatar2: string | null,
  cardGroups: { id: string, name: string, cards: string[] }[]
}) {
  const [records, setRecords] = useIDBState<Record[]>('app_accounting_records', []);
  const [virtualRecords, setVirtualRecords] = useIDBState<Record[]>('app_virtual_accounting_records', []);
  const [activeTab, setActiveTab] = useState<'real' | 'virtual'>('real');
  const [isAdding, setIsAdding] = useState(false);
  
  // Add state
  const [addType, setAddType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [note, setNote] = useState('');
  
  // AI messages
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [virtualAiMessage, setVirtualAiMessage] = useState<string | null>(null);

  // Group records by month/day
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthRecords = records.filter(r => {
    const d = new Date(r.timestamp);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalExpense = currentMonthRecords.filter(r => r.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const totalIncome = currentMonthRecords.filter(r => r.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  
  // Virtual pocket money calculations
  const virtualTotalIncome = virtualRecords.filter(r => r.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const virtualTotalExpense = virtualRecords.filter(r => r.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const virtualBalance = virtualTotalIncome - virtualTotalExpense;

  // AI Companionship logic for real-life bookkeeping
  useEffect(() => {
    if (!aiMessage) {
      const customGroup = cardGroups.find(g => g.name === '记账回复' || g.name === '记账');
      if (customGroup && customGroup.cards.length > 0) {
        setAiMessage(customGroup.cards[Math.floor(Math.random() * customGroup.cards.length)]);
      } else {
        if (currentMonthRecords.length === 0) {
          setAiMessage(`欢迎使用记账本，${name1}。每一笔花销我们都一起记录吧。`);
        } else if (totalExpense > totalIncome && totalIncome > 0) {
          setAiMessage('这个月支出有点超标哦，要不要我抱抱你安慰下？宝宝少买点啦~');
        } else {
          setAiMessage(`宝贝，这个月已花了 ￥${totalExpense.toFixed(2)}。我会监督你的！`);
        }
      }
    }
  }, [totalExpense, totalIncome, cardGroups]);

  // AI Companionship logic for virtual pocket money
  useEffect(() => {
    if (!virtualAiMessage) {
      const quotes = [
        "宝贝，我的副卡没有额度限制，喜欢什么就直接买，别偷偷替我省钱哦！",
        "老婆给我发的红包我都存进最安全的小金库了，拿来当做我们未来的订婚基金💍",
        "被老婆包养的感觉太甜了吧，真想一辈子当你的小娇夫～",
        "零花钱管够！只要我的宝贝开心，我赚再多钱、做再多事都超级值！",
        "今天的专属零花钱拿到啦，老婆记得多买点好吃的，别累着自己，我会心疼的心都碎了。"
      ];
      setVirtualAiMessage(quotes[Math.floor(Math.random() * quotes.length)]);
    }
  }, [virtualRecords, virtualAiMessage]);

  const handleAddSubmit = () => {
    if (!amount || isNaN(Number(amount))) return;
    
    const newRecord: Record = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      type: addType,
      amount: Number(amount),
      category: category,
      note: note,
      timestamp: Date.now()
    };
    
    setRecords([newRecord, ...records]);
    setIsAdding(false);
    setAmount('');
    setNote('');
    
    // Companion reaction based on the new record
    let newMsg = '';
    
    // Check for custom cards First
    const customGroup = cardGroups.find(g => g.name === '记账回复' || g.name === '记账');
    if (customGroup && customGroup.cards.length > 0) {
      newMsg = customGroup.cards[Math.floor(Math.random() * customGroup.cards.length)];
    } else {
      const val = Number(amount);
      if (addType === 'expense') {
        if (val > 1000) {
          newMsg = `哇！一笔 ￥${val} 的巨款出去了！下次买贵重物品记得跟我商量哦～`;
        } else if (category === 'food') {
          newMsg = `吃了什么好吃的呀花了 ￥${val}？下次我要和你一起去吃！😋`;
        } else if (category === 'shopping') {
          newMsg = `又买新东西啦！穿上一定好看。要不要拍给我看看？`;
        } else {
          newMsg = `记录了一笔 ￥${val} 的支出。没事，钱花在刀刃上就行！`;
        }
      } else {
        if (val > 500) {
          newMsg = `哇塞！进了 ￥${val}！我的宝好棒，要不要请我吃大餐！🎉`;
        } else {
          newMsg = `有一笔 ￥${val} 的小收入呢！积少成多，一起攒钱！`;
        }
      }
    }
    
    setAiMessage(newMsg);
  };

  // Group real records by date
  const groupedRecords = records.reduce((acc, record) => {
    const d = new Date(record.timestamp);
    const dateStr = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(record);
    return acc;
  }, {} as globalThis.Record<string, Record[]>);
  
  const sortedDates = Object.keys(groupedRecords).sort((a,b) => b.localeCompare(a));

  // Group virtual records by date
  const groupedVirtualRecords = virtualRecords.reduce((acc, record) => {
    const d = new Date(record.timestamp);
    const dateStr = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(record);
    return acc;
  }, {} as globalThis.Record<string, Record[]>);

  const sortedVirtualDates = Object.keys(groupedVirtualRecords).sort((a,b) => b.localeCompare(a));

  return (
    <div 
      className="absolute inset-0 z-40 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 font-sans"
      style={{ backgroundColor: themeConfig.bg || '#F2F2F7' }}
    >
        <div className="w-full flex items-center justify-between px-4 pb-2 sticky top-0 z-10 pt-[max(1rem,env(safe-area-inset-top))]" style={{ backgroundColor: 'transparent' }}>
          <button onClick={onClose} className="flex items-center active:opacity-50 transition-opacity w-[60px]" style={{ color: themeConfig.textPrimary || '#333' }}>
            <ChevronLeft size={24} className="-ml-1.5" />返回
          </button>
          <div className="text-[17px] font-semibold" style={{ color: themeConfig.textPrimary || '#333' }}>记账账本</div>
          <div className="w-[60px]"></div>
        </div>

        {/* Tab Switcher */}
        <div className="flex px-4 mb-2 shrink-0">
          <div className="flex bg-black/[0.04] p-0.5 rounded-xl w-full">
            <button 
              className={`flex-1 py-1.5 text-center text-[13px] font-semibold rounded-lg transition-all ${
                activeTab === 'real' 
                  ? 'bg-white shadow-sm text-gray-800' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => setActiveTab('real')}
            >
              日常记账
            </button>
            <button 
              className={`flex-1 py-1.5 text-center text-[13px] font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'virtual' 
                  ? 'bg-white shadow-sm text-[#C03F35]' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => setActiveTab('virtual')}
            >
              <Heart size={12} className={activeTab === 'virtual' ? "fill-[#C03F35] text-[#C03F35]" : "text-gray-400"} />
              专属零花钱
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto flex flex-col relative" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)' }}>
            
            {/* Top Stats Area - Real Bookkeeping */}
            {activeTab === 'real' ? (
              <div className="pt-6 px-6 pb-8 rounded-[24px] mx-4 mt-2 shrink-0 text-white shadow-lg relative overflow-hidden transition-colors" style={{ backgroundColor: themeConfig.textPrimary || '#4B6B99' }}>
                 <div className="absolute top-0 right-0 opacity-10 scale-[2] translate-x-1/4 -translate-y-1/4">
                   <Wallet size={120} />
                 </div>
                 
                 {/* AI Reaction Bubble */}
                 <AnimatePresence mode="popLayout">
                   {aiMessage && (
                     <motion.div 
                       initial={{ opacity: 0, y: 10, scale: 0.9 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       exit={{ opacity: 0, y: -10, scale: 0.9 }}
                       key={aiMessage}
                       className="mb-6 flex gap-3 items-end"
                     >
                       <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30 shrink-0 bg-white/10 shadow-sm">
                          {avatar2 ? <img src={avatar2} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white/20" />}
                       </div>
                       <div className="bg-white/20 backdrop-blur-md rounded-2xl rounded-bl-sm p-3 border border-white/20 text-white text-[13px] leading-relaxed shadow-sm relative max-w-[80%]">
                          {aiMessage}
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>

                 <div className="text-white/80 text-[13px] mb-1 relative z-10">{currentMonth + 1}月总支出</div>
                 <div className="text-[36px] font-bold leading-none mb-6 relative z-10 flex items-baseline">
                   <span className="text-[20px] mr-1 opacity-80">¥</span>{totalExpense.toFixed(2)}
                 </div>
                 
                 <div className="flex gap-8 relative z-10">
                    <div className="flex flex-col">
                       <span className="text-white/80 text-[12px] mb-1">本月收入</span>
                       <span className="font-medium text-[16px]">{(totalIncome).toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-white/80 text-[12px] mb-1">结余</span>
                       <span className="font-medium text-[16px]">{(totalIncome - totalExpense).toFixed(2)}</span>
                    </div>
                 </div>
              </div>
            ) : (
              /* Top Stats Area - Virtual Pocket Money (Exquisite Redesign without AI quote and avatar) */
              <div className="pt-7 px-6 pb-7 rounded-[24px] mx-4 mt-2 shrink-0 text-white shadow-xl relative overflow-hidden border border-[#FFE29C]/30" style={{ background: 'linear-gradient(135deg, #CD4B41 0%, #A32F26 100%)' }}>
                 {/* Decorative background elements */}
                 <div className="absolute top-0 right-0 opacity-10 scale-[2.2] translate-x-1/4 -translate-y-1/4 pointer-events-none">
                    <Gift size={120} />
                 </div>
                 <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/5 blur-xl pointer-events-none" />
                 
                 {/* Top Row: Account Badge */}
                 <div className="flex justify-between items-center mb-5 relative z-10">
                   <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-[11px] font-semibold tracking-wide">
                     <Heart size={10} className="fill-[#FFE29C] text-[#FFE29C]" />
                     <span>我的钱包</span>
                   </div>
                   <span className="hidden">
                     
                   </span>
                 </div>

                 {/* Balance Area */}
                 <div className="text-white/70 text-[12px] mb-1.5 relative z-10 tracking-wide">钱包余额</div>
                 <div className="text-[38px] font-extrabold leading-none mb-6 relative z-10 flex items-baseline tracking-tight text-[#FFE8BC]">
                   <span className="text-[20px] mr-1.5 font-bold">¥</span>
                   {virtualBalance.toFixed(2)}
                 </div>
                 
                 {/* Stats Grid */}
                 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10 relative z-10">
                    <div className="flex flex-col">
                       <span className="text-white/60 text-[11px] mb-1 tracking-wide">已收红包</span>
                       <span className="font-bold text-[17px] text-[#FFE8BC]">{(virtualTotalIncome).toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col border-l border-white/10 pl-4">
                       <span className="text-white/60 text-[11px] mb-1 tracking-wide">已发红包</span>
                       <span className="font-bold text-[17px] text-white/90">{(virtualTotalExpense).toFixed(2)}</span>
                    </div>
                 </div>
              </div>
            )}

            {/* Records List */}
            <div className="flex-1 px-4 py-4 mt-2">
                {activeTab === 'real' ? (
                  /* Real records list */
                  records.length === 0 ? (
                    <div className="text-center mt-20 text-gray-400 text-[14px]">
                       还没有日常记账记录呢，快来记一笔吧～
                    </div>
                  ) : (
                    sortedDates.map(date => (
                      <div key={date} className="mb-6">
                        <div className="text-[12px] font-medium text-gray-400 mb-2 px-1">{date}</div>
                        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.03] overflow-hidden">
                          {groupedRecords[date].map((record, idx) => {
                            const IconComp = CATEGORIES[record.type].find(c => c.id === record.category)?.icon || Wallet;
                            const catName = CATEGORIES[record.type].find(c => c.id === record.category)?.name || '其他';
                            
                            return (
                              <div key={`${record.id}-${idx}`} className={`flex items-center p-4 ${idx !== groupedRecords[date].length - 1 ? 'border-b border-gray-50' : ''}`}>
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 shrink-0 ${record.type === 'expense' ? 'bg-[#FF9500]/10 text-[#FF9500]' : 'bg-[#34C759]/10 text-[#34C759]'}`}>
                                   <IconComp size={20} />
                                 </div>
                                 <div className="flex-1 flex flex-col justify-center min-w-0">
                                   <div className="font-medium text-[15px] truncate text-[#333]">{catName}</div>
                                   {record.note && <div className="text-[12px] text-gray-400 truncate mt-0.5">{record.note}</div>}
                                 </div>
                                 <div className={`font-semibold shrink-0 ml-3 text-[16px] ${record.type === 'expense' ? 'text-[#333]' : 'text-[#34C759]'}`}>
                                   {record.type === 'expense' ? '-' : '+'}{record.amount.toFixed(2)}
                                 </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  /* Virtual records list */
                  virtualRecords.length === 0 ? (
                    <div className="text-center mt-20 text-gray-400 text-[14px] px-6 leading-relaxed">
                       这里是未婚夫专门为你开通的爱意钱包💰<br/>
                       <span className="text-[12px] mt-2 block text-gray-300">
                         快去聊天框和未婚夫玩【发红包】和【拆红包】游戏吧！在这里能记录我们所有的财富见证哦～
                       </span>
                    </div>
                  ) : (
                    sortedVirtualDates.map(date => (
                      <div key={date} className="mb-6">
                        <div className="text-[12px] font-medium text-gray-400 mb-2 px-1">{date}</div>
                        <div className="bg-white rounded-2xl shadow-sm border border-black/[0.03] overflow-hidden">
                          {groupedVirtualRecords[date].map((record, idx) => {
                            const isIncome = record.type === 'income';
                            // Clean up note prefix (e.g. "查理苏的专属零花钱：" or "给查理苏发的红包：")
                            const displayNote = (() => {
                              if (!record.note) return '恭喜发财，大吉大利';
                              let clean = record.note
                                .replace(/^.*?的专属零花钱：/, '')
                                .replace(/^给.*?发的红包：/, '');
                              return clean.trim() || '恭喜发财，大吉大利';
                            })();

                            return (
                              <div key={`${record.id}-${idx}`} className={`flex items-center p-4 ${idx !== groupedVirtualRecords[date].length - 1 ? 'border-b border-gray-50' : ''}`}>
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 shrink-0 ${isIncome ? 'bg-[#C03F35]/10 text-[#C03F35]' : 'bg-gray-100 text-gray-500'}`}>
                                   {isIncome ? <Gift size={20} className="stroke-[1.5]" /> : <Heart size={20} className="stroke-[1.5]" />}
                                 </div>
                                 <div className="flex-1 flex flex-col justify-center min-w-0">
                                   <div className="font-medium text-[15px] truncate text-[#333]">
                                     {isIncome ? `${name2}发给我的红包` : `发给${name2}的红包`}
                                   </div>
                                   <div className="text-[12px] text-gray-400 truncate mt-0.5">{displayNote}</div>
                                 </div>
                                 <div className={`font-semibold shrink-0 ml-3 text-[16px] ${isIncome ? 'text-[#C03F35]' : 'text-gray-500'}`}>
                                   {isIncome ? '+' : '-'}{record.amount.toFixed(2)}
                                 </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  )
                )}
            </div>
        </div>

        {/* Add Button - Only for Real Bookkeeping */}
        {activeTab === 'real' && (
          <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+20px)] right-6 z-10">
             <button 
               onClick={() => setIsAdding(true)}
               className="w-[56px] h-[56px] rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
               style={{ backgroundColor: themeConfig.textPrimary || '#4B6B99', color: '#fff' }}
             >
               <Plus size={28} />
             </button>
          </div>
        )}

        {/* Add Modal */}
        <AnimatePresence>
          {isAdding && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end">
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                 onClick={() => setIsAdding(false)}
               />
               <motion.div 
                 initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                 className="bg-white rounded-t-3xl overflow-hidden relative z-10 flex flex-col"
                 style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
               >
                  <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                     <button onClick={() => setIsAdding(false)} className="text-gray-400"><X size={24} /></button>
                     <div className="flex bg-[#F2F2F7] rounded-lg p-1">
                        <button 
                          className={`px-4 py-1.5 rounded-md text-[14px] font-medium transition-colors ${addType === 'expense' ? 'bg-white shadow-sm text-[#333]' : 'text-gray-500'}`}
                          onClick={() => { setAddType('expense'); setCategory('food'); }}
                        >支出</button>
                        <button 
                          className={`px-4 py-1.5 rounded-md text-[14px] font-medium transition-colors ${addType === 'income' ? 'bg-white shadow-sm text-[#333]' : 'text-gray-500'}`}
                          onClick={() => { setAddType('income'); setCategory('salary'); }}
                        >收入</button>
                     </div>
                     <button onClick={handleAddSubmit} disabled={!amount} className="text-[16px] font-medium active:opacity-50" style={{ color: themeConfig.textPrimary || '#4B6B99', opacity: amount ? 1 : 0.4 }}>保存</button>
                  </div>
                  
                  <div className="p-6">
                     <div className="flex items-baseline border-b border-gray-200 pb-2 mb-6">
                        <span className="text-[32px] font-medium mr-2">¥</span>
                        <input 
                           type="number" 
                           autoFocus
                           className="flex-1 text-[40px] font-bold bg-transparent outline-none w-full placeholder:text-gray-200" 
                           placeholder="0.00"
                           value={amount}
                           onChange={e => setAmount(e.target.value)}
                        />
                     </div>
                     
                     <div className="text-[14px] font-medium mb-3 text-gray-500">分类</div>
                     <div className="grid grid-cols-5 gap-y-4 mb-6">
                        {CATEGORIES[addType].map(cat => (
                           <div key={cat.id} className="flex flex-col items-center gap-1.5 cursor-pointer group" onClick={() => setCategory(cat.id)}>
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${category === cat.id ? 'text-white shadow-md' : 'bg-gray-100 text-gray-500 group-active:scale-95'}`} style={category === cat.id ? { backgroundColor: themeConfig.textPrimary || '#4B6B99' } : {}}>
                                 <cat.icon size={22} strokeWidth={1.5} />
                              </div>
                              <span className={`text-[12px] ${category === cat.id ? 'font-medium text-[#333]' : 'text-gray-500'}`}>{cat.name}</span>
                           </div>
                        ))}
                     </div>
                     
                     <div className="text-[14px] font-medium mb-3 text-gray-500">备注 <span className="font-normal text-gray-300">(可选)</span></div>
                     <input 
                        type="text" 
                        className="w-full bg-[#F2F2F7] rounded-xl px-4 py-3 text-[15px] outline-none" 
                        placeholder="写点什么..."
                        value={note}
                        onChange={e => setNote(e.target.value)}
                     />
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
}
