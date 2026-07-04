import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Plus, 
  Clock, 
  Receipt, 
  Ticket, 
  CalendarHeart, 
  Trash2, 
  Check, 
  BookOpen, 
  Film, 
  Star, 
  User,
  Bookmark
} from 'lucide-react';
import { useIDBState } from './utils';

interface WishlistViewProps {
  onClose: () => void;
  themeConfig: any;
  cardGroups: any[];
  myNickname: string;
  mjNickname: string;
  wishlistCardOpacity?: number;
}

export type WishlistType = 'date' | 'show' | 'shopping' | 'book' | 'movie';
export type MediaStatus = 'want' | 'doing' | 'done';

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
  
  // Custom fields for media
  creator?: string;      // Author / Director
  rating?: number;       // 1 - 5 stars
  mediaStatus?: MediaStatus; // 想看/在看/已看 etc.
}

export const WishlistView = ({ onClose, themeConfig, wishlistCardOpacity = 85 }: WishlistViewProps) => {
  const [items, setItems] = useIDBState<WishlistItem[]>('app_wishlist', []);
  const [wishlistBg] = useIDBState<string>('app_wishlist_bg', '');
  const [activeFilter, setActiveFilter] = useState<'all' | 'book' | 'movie' | 'wishlist'>('all');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMainType, setAddMainType] = useState<'book' | 'movie' | 'wishlist'>('book');
  const [addWishlistSubtype, setAddWishlistSubtype] = useState<'date' | 'show' | 'shopping'>('date');
  
  // Form fields
  const [addTitle, setAddTitle] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addTime, setAddTime] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addCreator, setAddCreator] = useState('');
  const [addRating, setAddRating] = useState(5);
  const [addMediaStatus, setAddMediaStatus] = useState<MediaStatus>('want');

  const handleAdd = () => {
    if (!addTitle.trim()) return;

    const current = Date.now();
    const finalType = addMainType === 'wishlist' ? addWishlistSubtype : addMainType;
    const targetTimeMs = addTime ? new Date(addTime).getTime() : undefined;

    const newItem: WishlistItem = {
      id: current.toString(),
      type: finalType,
      title: addTitle.trim(),
      notes: addNotes.trim(),
      targetTime: targetTimeMs,
      price: finalType === 'shopping' ? Number(addPrice) || 0 : undefined,
      status: 'pending',
      createdAt: current,
      
      creator: (addMainType !== 'wishlist' && addCreator.trim()) ? addCreator.trim() : undefined,
      rating: addMainType !== 'wishlist' ? addRating : undefined,
      mediaStatus: addMainType !== 'wishlist' ? addMediaStatus : undefined
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
    setAddCreator('');
    setAddRating(5);
    setAddMediaStatus('want');
  };

  const handleComplete = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextMediaStatus = item.mediaStatus ? 'done' as MediaStatus : undefined;
        return {
          ...item,
          status: 'completed',
          mediaStatus: nextMediaStatus,
          completedAt: Date.now()
        };
      }
      return item;
    }));
  };

  const handleToggleMediaStatus = (id: string, currentStatus: MediaStatus) => {
    const nextStatusMap: Record<MediaStatus, MediaStatus> = {
      'want': 'doing',
      'doing': 'done',
      'done': 'want'
    };
    const nextStatus = nextStatusMap[currentStatus];
    
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          mediaStatus: nextStatus,
          status: nextStatus === 'done' ? 'completed' : 'pending',
          completedAt: nextStatus === 'done' ? Date.now() : undefined
        };
      }
      return item;
    }));
  };

  const handleDelete = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Filter categories
  const filteredItems = items.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'book') return item.type === 'book';
    if (activeFilter === 'movie') return item.type === 'movie';
    if (activeFilter === 'wishlist') {
      return item.type === 'shopping' || item.type === 'date' || item.type === 'show';
    }
    return true;
  }).sort((a, b) => b.createdAt - a.createdAt);

  const formatDate = (ms: number) => {
    const d = new Date(ms);
    return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const getMediaStatusLabel = (type: WishlistType, status?: MediaStatus) => {
    if (!status) return '';
    if (type === 'book') {
      return status === 'want' ? '想读' : status === 'doing' ? '在读' : '已读';
    } else if (type === 'movie') {
      return status === 'want' ? '想看' : status === 'doing' ? '在看' : '已看';
    }
    return '';
  };

  const getMediaStatusColor = (status?: MediaStatus) => {
    if (!status) return {};
    if (status === 'want') return { bg: 'rgba(59, 130, 246, 0.1)', text: '#2563eb', border: 'rgba(59, 130, 246, 0.2)' };
    if (status === 'doing') return { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706', border: 'rgba(245, 158, 11, 0.2)' };
    return { bg: 'rgba(16, 185, 129, 0.1)', text: '#059669', border: 'rgba(16, 185, 129, 0.2)' };
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
      style={{
        backgroundColor: themeConfig.bg || '#fcfbf9',
        backgroundImage: wishlistBg ? `url(${wishlistBg})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Top Header */}
      <div className="relative pt-[env(safe-area-inset-top)] shadow-sm z-10 shrink-0" style={{ backgroundColor: wishlistBg ? (themeConfig.bg ? themeConfig.bg + 'cc' : '#fcfbf9cc') : (themeConfig.bg || '#fcfbf9'), backdropFilter: wishlistBg ? 'blur(12px)' : 'none' }}>
        <div className="flex justify-between items-center px-4 h-14" style={{ color: themeConfig.textPrimary }}>
          <button onClick={onClose} className="p-2 -ml-2 active:opacity-50">
            <ChevronLeft size={24} />
          </button>
          <div className="font-semibold text-[16px] tracking-wide flex items-center gap-1.5">
            <BookOpen size={18} strokeWidth={2} />
            <span>书影音记录</span>
          </div>
          
          <div className="flex items-center gap-1">
              <button onClick={() => { setAddMainType('book'); setShowAddModal(true); }} className="p-2 -mr-2 active:opacity-50">
                <Plus size={24} />
              </button>
          </div>
        </div>

        {/* Categories Tab Selector */}
        <div className="flex items-center px-4 py-3 gap-2 overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: '全部' },
            { id: 'book', label: '书籍' },
            { id: 'movie', label: '电影' },
            { id: 'wishlist', label: '心愿清单' }
          ].map(filter => (
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

      {/* Main Container Lists */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-safe">
        {filteredItems.length === 0 && (
           <div className="text-center text-[14px] mt-24" style={{ color: themeConfig.textSecondary }}>暂无记录，快去记录第一条吧</div>
        )}
        {filteredItems.map((item, i) => {
          const isCompleted = item.status === 'completed';
          const isMedia = item.type === 'book' || item.type === 'movie';

          return (
            <div 
              key={`${item.id}-${i}`} 
              className="p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] relative flex flex-col gap-3.5 transition-opacity backdrop-blur-md"
              style={{ 
                backgroundColor: themeConfig.cardBg ? themeConfig.cardBg.replace(/0\.\d+\)/, `${wishlistCardOpacity / 100})`) : `rgba(255,255,255,${wishlistCardOpacity / 100})`,
                opacity: isCompleted ? 0.75 : 1,
                ...(isMedia ? {
                    borderRadius: '20px',
                    border: `1px solid ${themeConfig.textSecondary}15`,
                } : item.type === 'date' ? {
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
              {/* Type-specific background decorations for Wishlist */}
              {item.type === 'date' && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 opacity-30 pointer-events-none rounded-t-[16px]" style={{
                      backgroundImage: `repeating-linear-gradient(45deg, ${themeConfig.textPrimary}, ${themeConfig.textPrimary} 15px, transparent 15px, transparent 30px, ${themeConfig.textSecondary}, ${themeConfig.textSecondary} 45px, transparent 45px, transparent 60px)`
                  }} />
              )}
              {item.type === 'show' && (
                  <div className="absolute top-4 bottom-4 right-[25%] w-px border-r-2 border-dashed opacity-20 pointer-events-none" style={{ borderColor: themeConfig.textSecondary }} />
              )}

              {/* Header Info */}
              <div className="flex justify-between items-center text-[12px]" style={{ color: themeConfig.textSecondary }}>
                <div className="flex items-center gap-1.5 font-semibold">
                  {item.type === 'book' && <BookOpen size={14} className="text-[#8B5CF6]" />}
                  {item.type === 'movie' && <Film size={14} className="text-[#3B82F6]" />}
                  {item.type === 'date' && <CalendarHeart size={14} className="text-[#EF4444]" />}
                  {item.type === 'show' && <Ticket size={14} className="text-[#F59E0B]" />}
                  {item.type === 'shopping' && <Receipt size={14} className="text-[#10B981]" />}
                  
                  <span className="tracking-wide uppercase text-[11px]">
                     {item.type === 'book' ? '图书' : item.type === 'movie' ? '电影' : item.type === 'date' ? '约会邀约' : item.type === 'show' ? '演出邀约' : '购物车'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                   <div className="text-[10px] opacity-70 font-mono">{formatDate(item.createdAt)}</div>
                   <button onClick={() => handleDelete(item.id)} className="p-1 active:opacity-50"><Trash2 size={14}/></button>
                </div>
              </div>

              {/* Title & Creator */}
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-[17px] leading-snug tracking-tight" style={{ color: themeConfig.textPrimary }}>
                    {item.type === 'book' || item.type === 'movie' ? `《${item.title}》` : item.title}
                  </h3>
                  
                  {isMedia && item.mediaStatus && (
                    <button 
                      onClick={() => handleToggleMediaStatus(item.id, item.mediaStatus!)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider transition-all border shrink-0 active:scale-95"
                      style={{
                        backgroundColor: getMediaStatusColor(item.mediaStatus).bg,
                        color: getMediaStatusColor(item.mediaStatus).text,
                        borderColor: getMediaStatusColor(item.mediaStatus).border
                      }}
                    >
                      {getMediaStatusLabel(item.type, item.mediaStatus)}
                    </button>
                  )}
                </div>

                {isMedia && item.creator && (
                  <div className="flex items-center gap-1 text-[13px] font-medium opacity-80" style={{ color: themeConfig.textSecondary }}>
                    <User size={12} />
                    <span>{item.type === 'book' ? '作者：' : '导演：'}{item.creator}</span>
                  </div>
                )}
              </div>

              {/* Rating representation */}
              {isMedia && typeof item.rating === 'number' && (
                <div className="flex items-center gap-1">
                  <span className="text-[12px] mr-1.5" style={{ color: themeConfig.textSecondary }}>评分：</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star 
                        key={star} 
                        size={14} 
                        className={star <= (item.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-black/10 dark:text-white/10'} 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Thoughts / Review Notes */}
              {item.notes && (
                <div className="text-[13.5px] leading-relaxed px-3 py-2.5 rounded-[12px] bg-black/5" style={{ color: themeConfig.textSecondary }}>
                  {item.notes}
                </div>
              )}

              {/* Action and Pricing */}
              <div className="flex items-end justify-between mt-1">
                 <div className="flex flex-col gap-1 text-[13px]" style={{ color: themeConfig.textSecondary }}>
                     {item.type === 'shopping' ? (
                         item.price ? <div className="font-mono font-medium text-emerald-600">¥{item.price.toFixed(2)}</div> : <div>价格未定</div>
                     ) : !isMedia ? (
                         item.targetTime ? (
                            <div className="flex items-center gap-1 text-[11px] font-mono">
                               <Clock size={12} />
                               <span>{formatDate(item.targetTime)}</span>
                            </div>
                         ) : <div>时间待定</div>
                     ) : null}
                 </div>
                 
                 {/* Action Button for Non-Media items (Wishlist targets) */}
                 {!isMedia && (
                   !isCompleted ? (
                     <button 
                       onClick={() => handleComplete(item.id)}
                       className="px-4 py-1.5 rounded-full text-[12px] font-semibold active:scale-95 transition-all shadow-sm"
                       style={{ backgroundColor: themeConfig.textPrimary, color: themeConfig.bg || '#fff' }}
                     >
                       {item.type === 'shopping' ? '标记已购' : '标记完成'}
                     </button>
                   ) : (
                     <div className="flex items-center gap-1 text-[12px] font-medium opacity-60" style={{ color: themeConfig.textPrimary }}>
                       <Check size={14} /> 
                       {item.type === 'shopping' ? '已购' : '已完成'}
                     </div>
                   )
                 )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Add Item Modal Bottom Sheet */}
      {showAddModal && (
        <div className="absolute inset-0 z-50 bg-black/50 flex flex-col justify-end animate-in fade-in duration-200">
          <div className="rounded-t-[24px] pb-safe animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col" style={{ backgroundColor: themeConfig.bg || '#fff' }}>
             
             {/* Modal Header */}
             <div className="flex justify-between items-center px-4 py-4 border-b border-black/5 shrink-0">
                 <button onClick={() => {setShowAddModal(false); resetForm();}} className="text-[15px] font-medium active:opacity-50" style={{ color: themeConfig.textSecondary }}>取消</button>
                 <div className="font-semibold text-[16px]" style={{ color: themeConfig.textPrimary }}>记录新足迹</div>
                 <button 
                   onClick={handleAdd}
                   disabled={!addTitle.trim()}
                   className="text-[15px] font-semibold"
                   style={{ color: addTitle.trim() ? themeConfig.textPrimary : themeConfig.textSecondary, opacity: addTitle.trim() ? 1 : 0.4 }}
                 >
                   发布
                 </button>
             </div>

             {/* Modal Form Scroll Area */}
             <div className="p-4 space-y-4 overflow-y-auto flex-1">
                
                {/* Main Category Selector (Book/Movie/Wishlist) */}
                <div className="flex p-1 rounded-xl bg-black/5">
                   {[
                     { id: 'book', label: '书籍' },
                     { id: 'movie', label: '电影' },
                     { id: 'wishlist', label: '心愿' }
                   ].map(opt => (
                     <button
                       key={opt.id}
                       onClick={() => setAddMainType(opt.id as any)}
                       className="flex-1 py-1.5 text-[13px] font-semibold rounded-lg transition-colors"
                       style={{ 
                          backgroundColor: addMainType === opt.id ? themeConfig.cardBg || '#fff' : 'transparent',
                          color: addMainType === opt.id ? themeConfig.textPrimary : themeConfig.textSecondary,
                          boxShadow: addMainType === opt.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
                       }}
                     >
                       {opt.label}
                     </button>
                   ))}
                </div>

                {/* Subtype Selector for Wishlist */}
                {addMainType === 'wishlist' && (
                  <div className="flex p-1 rounded-lg bg-black/5 border border-black/5">
                    {[
                      { id: 'date', label: '约会邀约' },
                      { id: 'show', label: '演出邀约' },
                      { id: 'shopping', label: '购物车' }
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setAddWishlistSubtype(opt.id as any)}
                        className="flex-1 py-1 text-[12px] font-medium rounded-md transition-colors"
                        style={{ 
                           backgroundColor: addWishlistSubtype === opt.id ? themeConfig.cardBg || '#fff' : 'transparent',
                           color: addWishlistSubtype === opt.id ? themeConfig.textPrimary : themeConfig.textSecondary,
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-4 pt-1">
                  
                  {/* Title (Common) */}
                  <div className="rounded-xl p-3 border border-black/5 bg-black/5" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <input 
                      type="text" 
                      placeholder={
                        addMainType === 'book' ? "书名 (必填)" : 
                        addMainType === 'movie' ? "电影名 (必填)" : "名称 (必填)"
                      }
                      value={addTitle}
                      onChange={e => setAddTitle(e.target.value)}
                      className="w-full bg-transparent text-[15px] outline-none font-semibold placeholder:font-normal"
                      style={{ color: themeConfig.textPrimary }}
                    />
                  </div>

                  {/* Creator (Author / Director for media) */}
                  {addMainType !== 'wishlist' && (
                    <div className="rounded-xl p-3 border border-black/5 bg-black/5" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                      <input 
                        type="text" 
                        placeholder={
                          addMainType === 'book' ? "作者 (选填)" : "导演 (选填)"
                        }
                        value={addCreator}
                        onChange={e => setAddCreator(e.target.value)}
                        className="w-full bg-transparent text-[14px] outline-none"
                        style={{ color: themeConfig.textPrimary }}
                      />
                    </div>
                  )}

                  {/* Media Status Selection */}
                  {addMainType !== 'wishlist' && (
                    <div className="space-y-2">
                      <label className="text-[12px] font-semibold text-[#8E8E93] uppercase block px-1">当前进度</label>
                      <div className="flex gap-2.5">
                        {[
                          { id: 'want', label: addMainType === 'book' ? '想读' : '想看' },
                          { id: 'doing', label: addMainType === 'book' ? '在读' : '在看' },
                          { id: 'done', label: addMainType === 'book' ? '已读' : '已看' }
                        ].map(st => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setAddMediaStatus(st.id as MediaStatus)}
                            className="flex-1 py-2 text-[13px] font-semibold rounded-xl border transition-all active:scale-95"
                            style={{
                              backgroundColor: addMediaStatus === st.id ? themeConfig.textPrimary : 'transparent',
                              color: addMediaStatus === st.id ? themeConfig.bg : themeConfig.textSecondary,
                              borderColor: addMediaStatus === st.id ? themeConfig.textPrimary : 'rgba(0,0,0,0.1)'
                            }}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Star Rating */}
                  {addMainType !== 'wishlist' && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-black/5 bg-black/5" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                      <span className="text-[13.5px] font-semibold" style={{ color: themeConfig.textSecondary }}>评分</span>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setAddRating(star)}
                            className="active:scale-90 transition-transform p-0.5"
                          >
                            <Star 
                              size={22} 
                              className={star <= addRating ? 'fill-amber-400 text-amber-400' : 'text-black/15 dark:text-white/15'} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes & Description (Common) */}
                  <div className="rounded-xl p-3 border border-black/5 bg-black/5" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <textarea 
                      placeholder={
                        addMainType === 'book' ? "写下想法、短评或笔记..." : 
                        addMainType === 'movie' ? "写下影评、经典台词或想法..." : "写下备注说明等..."
                      }
                      value={addNotes}
                      onChange={e => setAddNotes(e.target.value)}
                      className="w-full bg-transparent text-[14px] outline-none resize-none h-24"
                      style={{ color: themeConfig.textPrimary }}
                    />
                  </div>

                  {/* Date Input for dates/shows */}
                  {addMainType === 'wishlist' && (addWishlistSubtype === 'date' || addWishlistSubtype === 'show') && (
                    <div className="rounded-xl p-3 border border-black/5 bg-black/5" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                      <label className="text-[11px] font-semibold text-[#8E8E93] uppercase block mb-1">计划时间</label>
                      <input 
                        type="datetime-local" 
                        value={addTime}
                        onChange={e => setAddTime(e.target.value)}
                        className="w-full bg-transparent text-[14px] outline-none"
                        style={{ color: themeConfig.textPrimary }}
                      />
                    </div>
                  )}

                  {/* Price Input for Shopping */}
                  {addMainType === 'wishlist' && addWishlistSubtype === 'shopping' && (
                    <div className="rounded-xl p-3 border border-black/5 flex items-center bg-black/5" style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                      <span className="mr-2 font-semibold" style={{ color: themeConfig.textSecondary }}>¥</span>
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
