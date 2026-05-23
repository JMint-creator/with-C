import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Clock, Receipt, Ticket, CalendarHeart, Trash2, Check } from 'lucide-react';
import { useLocalState, compressImage } from './utils';

interface WishlistViewProps {
  onClose: () => void;
  themeConfig: any;
  cardGroups: any[];
  myNickname: string;
  mjNickname: string;
  wishlistCardOpacity?: number;
}

export type WishlistType = 'date' | 'show' | 'shopping';

export interface WishlistItem {
  id: string;
  type: WishlistType;
  title: string;
  notes: string;
  targetTime?: number;
  price?: number;
  status: 'pending' | 'completed';
  createdAt: number;
  completedAt?: number;
  mengjiaoComment?: string;
  commentVisibleAt?: number;
}

export const WishlistView = ({ onClose, themeConfig, cardGroups, myNickname, mjNickname, wishlistCardOpacity = 85 }: WishlistViewProps) => {
  const [items, setItems] = useLocalState<WishlistItem[]>('app_wishlist', []);
  const [wishlistBg, setWishlistBg] = useLocalState<string>('app_wishlist_bg', '');
  const [activeFilter, setActiveFilter] = useState<'all' | WishlistType>('all');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<WishlistType>('date');
  const [addTitle, setAddTitle] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addTime, setAddTime] = useState('');
  const [addPrice, setAddPrice] = useState('');

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const pickRandomCards = (min: number, max: number) => {
    const allCards: string[] = [];
    cardGroups.forEach(g => {
        allCards.push(...(g.cards || []));
    });
    if (allCards.length === 0) return '太棒了！';
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const res = [];
    for(let i=0; i<count; i++) {
        res.push(allCards[Math.floor(Math.random() * allCards.length)]);
    }
    return res.join(' ');
  };

  const handleAdd = () => {
    if (!addTitle.trim()) return;

    const current = Date.now();
    let commentText = pickRandomCards(1, 3);
    
    // Shopping comments appear 20 mins - 2 hours later
    let commentVisibleAt = 0;
    if (addType === 'shopping') {
      const delayMs = Math.floor(Math.random() * (120 - 20 + 1) + 20) * 60 * 1000;
      commentVisibleAt = current + delayMs;
    }

    const targetTimeMs = addTime ? new Date(addTime).getTime() : undefined;

    const newItem: WishlistItem = {
      id: current.toString(),
      type: addType,
      title: addTitle.trim(),
      notes: addNotes.trim(),
      targetTime: targetTimeMs,
      price: addType === 'shopping' ? Number(addPrice) || 0 : undefined,
      status: 'pending',
      createdAt: current,
      mengjiaoComment: commentText,
      commentVisibleAt: commentVisibleAt || undefined
    };

    setItems(prev => [newItem, ...prev]);
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setAddTitle('');
    setAddNotes('');
    setAddTime('');
    setAddPrice('');
  };

  const handleComplete = (id: string, type: WishlistType) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: 'completed',
          completedAt: Date.now(),
          // For date & show, comment appears instantly upon completion
          commentVisibleAt: type === 'shopping' ? item.commentVisibleAt : Date.now()
        };
      }
      return item;
    }));
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const filteredItems = items.filter(i => activeFilter === 'all' || i.type === activeFilter).sort((a,b) => b.createdAt - a.createdAt);

  const formatDate = (ms: number) => {
    const d = new Date(ms);
    return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300" style={{ 
        backgroundColor: themeConfig.bg || '#fcfbf9',
        backgroundImage: wishlistBg ? `url(${wishlistBg})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
    }}>
      <div className="relative pt-[env(safe-area-inset-top)] shadow-sm z-10 shrink-0" style={{ backgroundColor: wishlistBg ? (themeConfig.bg ? themeConfig.bg + 'cc' : '#fcfbf9cc') : (themeConfig.bg || '#fcfbf9'), backdropFilter: wishlistBg ? 'blur(12px)' : 'none' }}>
        <div className="flex justify-between items-center px-4 h-14" style={{ color: themeConfig.textPrimary }}>
          <button onClick={onClose} className="p-2 -ml-2 active:opacity-50">
            <ChevronLeft size={24} />
          </button>
          <div className="font-semibold text-[16px] tracking-wide">心愿清单</div>
          
          <div className="flex items-center gap-1">
              <button onClick={() => setShowAddModal(true)} className="p-2 -mr-2 active:opacity-50">
                <Plus size={24} />
              </button>
          </div>
        </div>
        <div className="flex items-center px-4 py-3 gap-3 overflow-x-auto scrollbar-hide">
          {[{id:'all', label:'全部'}, {id:'date', label:'约会邀约'}, {id:'show', label:'演出邀约'}, {id:'shopping', label:'购物车'}].map(filter => (
            <button 
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${activeFilter === filter.id ? 'shadow-sm' : 'bg-black/5'}`}
              style={{
                 backgroundColor: activeFilter === filter.id ? themeConfig.textPrimary : '',
                 color: activeFilter === filter.id ? themeConfig.bg : themeConfig.textSecondary,
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-safe">
        {filteredItems.length === 0 && (
           <div className="text-center text-[14px] mt-20" style={{ color: themeConfig.textSecondary }}>暂无内容</div>
        )}
        {filteredItems.map(item => {
          
          const isCompleted = item.status === 'completed';
          const showComment = item.commentVisibleAt && now >= item.commentVisibleAt && item.mengjiaoComment;

          return (
            <div 
              key={item.id} 
              className="p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] relative flex flex-col gap-3 transition-opacity backdrop-blur-md"
              style={{ 
                backgroundColor: themeConfig.cardBg ? themeConfig.cardBg.replace(/0\.\d+\)/, `${wishlistCardOpacity / 100})`) : `rgba(255,255,255,${wishlistCardOpacity / 100})`,
                opacity: isCompleted ? 0.7 : 1,
                ...(item.type === 'date' ? {
                    borderRadius: '16px',
                    border: `1px solid ${themeConfig.textSecondary}20`,
                } : item.type === 'show' ? {
                    borderRadius: '16px',
                    WebkitMaskImage: 'radial-gradient(circle at 0 50%, transparent 12px, black 12.5px), radial-gradient(circle at 100% 50%, transparent 12px, black 12.5px)',
                    WebkitMaskSize: '55% 100%',
                    WebkitMaskPosition: 'left top, right top',
                    WebkitMaskRepeat: 'no-repeat',
                } : {
                    borderRadius: '0',
                    borderLeft: `1px solid ${themeConfig.textSecondary}20`,
                    borderRight: `1px solid ${themeConfig.textSecondary}20`,
                    paddingTop: '24px',
                    paddingBottom: '24px',
                    WebkitMaskImage: 'radial-gradient(circle at 6px 0, transparent 4px, black 4.5px), radial-gradient(circle at 6px 100%, transparent 4px, black 4.5px)',
                    WebkitMaskSize: '12px 55%',
                    WebkitMaskPosition: 'top left, bottom left',
                    WebkitMaskRepeat: 'repeat-x',
                })
              }}
            >
              {/* Type-specific background decorations */}
              {item.type === 'date' && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 opacity-30 pointer-events-none rounded-t-[16px]" style={{
                      backgroundImage: `repeating-linear-gradient(45deg, ${themeConfig.textPrimary}, ${themeConfig.textPrimary} 15px, transparent 15px, transparent 30px, ${themeConfig.textSecondary}, ${themeConfig.textSecondary} 45px, transparent 45px, transparent 60px)`
                  }} />
              )}
              {item.type === 'show' && (
                 <div className="absolute top-4 bottom-4 right-[25%] w-px border-r-2 border-dashed opacity-20 pointer-events-none" style={{ borderColor: themeConfig.textSecondary }} />
              )}
              {/* Header */}
              <div className="flex justify-between items-center text-[12px]" style={{ color: themeConfig.textSecondary }}>
                <div className="flex items-center gap-1.5 font-medium">
                  {item.type === 'date' && <CalendarHeart size={14} />}
                  {item.type === 'show' && <Ticket size={14} />}
                  {item.type === 'shopping' && <Receipt size={14} />}
                  <span>
                     {item.type === 'date' ? '约会邀约' : item.type === 'show' ? '演出邀约' : '购物车'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="text-[10px] opacity-70">{formatDate(item.createdAt)}</div>
                   <button onClick={() => handleDelete(item.id)} className="active:opacity-50"><Trash2 size={14}/></button>
                </div>
              </div>

              {/* Content */}
              <div>
                <h3 className="font-semibold text-[17px] mb-1" style={{ color: themeConfig.textPrimary }}>
                  {item.title}
                </h3>
                {item.notes && (
                  <div className="text-[13px] line-clamp-2" style={{ color: themeConfig.textSecondary }}>
                    {item.notes}
                  </div>
                )}
              </div>

              {/* Details & Action */}
              <div className="flex items-end justify-between mt-1">
                 <div className="flex flex-col gap-1 text-[13px]" style={{ color: themeConfig.textSecondary }}>
                     {item.type === 'shopping' ? (
                         item.price ? <div className="font-mono font-medium">¥{item.price.toFixed(2)}</div> : <div>价格未定</div>
                     ) : (
                         item.targetTime ? (
                            <div className="flex items-center gap-1">
                               <Clock size={13} />
                               <span>{formatDate(item.targetTime)}</span>
                            </div>
                         ) : <div>时间待定</div>
                     )}
                 </div>
                 
                 {/* Action Button */}
                 {!isCompleted ? (
                   <button 
                     onClick={() => handleComplete(item.id, item.type)}
                     className="px-4 py-1.5 rounded-full text-[12px] font-medium active:scale-95 transition-all shadow-sm"
                     style={{ backgroundColor: themeConfig.textPrimary, color: themeConfig.bg || '#fff' }}
                   >
                     {item.type === 'shopping' ? '标记已购' : '标记完成'}
                   </button>
                 ) : (
                   <div className="flex items-center gap-1 text-[12px] font-medium opacity-60" style={{ color: themeConfig.textPrimary }}>
                     <Check size={14} /> 
                     {item.type === 'shopping' ? '已购' : '已完成'}
                   </div>
                 )}
              </div>

              {/* Mengjiao's Reply Area */}
              <div className="mt-2 pt-3 border-t border-black/5">
                 <div className="text-[11px] mb-1.5 font-medium" style={{ color: themeConfig.textSecondary }}>
                    {mjNickname} 的回应
                 </div>
                 <div className="text-[13px] min-h-[20px]" style={{ color: themeConfig.textPrimary }}>
                    {showComment ? (
                       <span className="animate-in fade-in leading-relaxed">{item.mengjiaoComment}</span>
                    ) : (
                       <span className="opacity-40 italic flex items-center h-full">
                           {isCompleted ? '等待回应中...' : '尚未达成，等待回应...'}
                       </span>
                    )}
                 </div>
              </div>
            </div>
          )
        })}
      </div>

      {showAddModal && (
        <div className="absolute inset-0 z-50 bg-black/50 flex flex-col justify-end animate-in fade-in duration-200">
          <div className="rounded-t-[20px] pb-safe animate-in slide-in-from-bottom duration-300" style={{ backgroundColor: themeConfig.bg || '#fff' }}>
             <div className="flex justify-between items-center px-4 py-4 border-b border-black/5">
                 <button onClick={() => {setShowAddModal(false); resetForm();}} className="text-[15px] active:opacity-50" style={{ color: themeConfig.textSecondary }}>取消</button>
                 <div className="font-semibold text-[16px]" style={{ color: themeConfig.textPrimary }}>添加心愿</div>
                 <button 
                   onClick={handleAdd}
                   disabled={!addTitle.trim()}
                   className="text-[15px] font-medium"
                   style={{ color: addTitle.trim() ? themeConfig.textPrimary : themeConfig.textSecondary, opacity: addTitle.trim() ? 1 : 0.5 }}
                 >
                   完成
                 </button>
             </div>
             <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="flex p-1 rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>
                   {[{id:'date', label:'约会'}, {id:'show', label:'演出'}, {id:'shopping', label:'购物'}].map(opt => (
                     <button
                       key={opt.id}
                       onClick={() => setAddType(opt.id as any)}
                       className="flex-1 py-1.5 text-[14px] font-medium rounded-md transition-colors"
                       style={{ 
                          backgroundColor: addType === opt.id ? themeConfig.cardBg : 'transparent',
                          color: addType === opt.id ? themeConfig.textPrimary : themeConfig.textSecondary,
                          boxShadow: addType === opt.id ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
                       }}
                     >
                       {opt.label}
                     </button>
                   ))}
                </div>

                <div className="space-y-4 pt-2">
                  <div className="rounded-lg p-3 border border-black/5" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <input 
                      type="text" 
                      placeholder="标题 (必填)"
                      value={addTitle}
                      onChange={e => setAddTitle(e.target.value)}
                      className="w-full bg-transparent text-[15px] outline-none font-medium"
                      style={{ color: themeConfig.textPrimary }}
                    />
                  </div>
                  <div className="rounded-lg p-3 border border-black/5" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <textarea 
                      placeholder="备注信息 (选填)"
                      value={addNotes}
                      onChange={e => setAddNotes(e.target.value)}
                      className="w-full bg-transparent text-[14px] outline-none resize-none h-20"
                      style={{ color: themeConfig.textPrimary }}
                    />
                  </div>

                  {(addType === 'date' || addType === 'show') && (
                    <div className="rounded-lg p-3 border border-black/5" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                      <input 
                        type="datetime-local" 
                        value={addTime}
                        onChange={e => setAddTime(e.target.value)}
                        className="w-full bg-transparent text-[14px] outline-none"
                        style={{ color: themeConfig.textPrimary }}
                      />
                    </div>
                  )}

                  {addType === 'shopping' && (
                    <div className="rounded-lg p-3 border border-black/5 flex items-center" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                      <span className="mr-2" style={{ color: themeConfig.textSecondary }}>¥</span>
                      <input 
                        type="number" 
                        placeholder="价格 (选填)"
                        value={addPrice}
                        onChange={e => setAddPrice(e.target.value)}
                        className="w-full bg-transparent text-[14px] outline-none"
                        style={{ color: themeConfig.textPrimary }}
                      />
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
