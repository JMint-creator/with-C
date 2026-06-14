import React, { useState, useMemo } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, Navigation, Clock, Camera, CheckCircle2 } from 'lucide-react';
import { useIDBState, useLocalState } from './utils';
import { motion, AnimatePresence } from 'motion/react';

export type CheckInRecord = {
  id: string;
  timestamp: number;
  text: string;
  imageUrl?: string;
};

export const CheckInsView = ({ onClose, themeConfig, checkinsBg }: any) => {
  const [mjNickname] = useLocalState('app_mjNickname', '梦角');
  const [checkIns] = useIDBState<CheckInRecord[]>('app_checkins', []);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Format checkins by date for the calendar
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const currentMonthDays = getDaysInMonth(selectedDate);
  const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();

  const handleDayClick = (day: number) => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day));
  };

  const selectedDateStr = selectedDate.toLocaleDateString();
  const selectedDayCheckIns = checkIns.filter(
    (c) => new Date(c.timestamp).toLocaleDateString() === selectedDateStr
  ).sort((a,b) => a.timestamp - b.timestamp);

  const prevMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const checkInCountsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    checkIns.forEach(c => {
       const dStr = new Date(c.timestamp).toLocaleDateString();
       counts[dStr] = (counts[dStr] || 0) + 1;
    });
    return counts;
  }, [checkIns]);

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 text-[14px]" 
      style={{ 
        color: themeConfig.textPrimary || '#333',
        backgroundColor: themeConfig.bg || '#F2F2F7',
        backgroundImage: checkinsBg ? `url(${checkinsBg})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background Graphic overlay if no image */}
      {!checkinsBg && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-50">
           <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-b from-[currentColor] to-transparent opacity-10 blur-3xl"></div>
        </div>
      )}

      {/* Header */}
      <div className="relative pt-[env(safe-area-inset-top)] shadow-sm z-10 shrink-0 border-b border-black/5" style={{ backgroundColor: checkinsBg ? (themeConfig.bg ? themeConfig.bg + 'cc' : '#f2f2f7cc') : (themeConfig.bg || '#f2f2f7'), backdropFilter: checkinsBg ? 'blur(12px)' : 'none' }}>
        <div className="flex justify-between items-center px-4 h-14">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-transform -ml-2">
            <ChevronLeft size={24} className="mr-0.5" />
          </button>
          <div className="text-[17px] font-semibold tracking-wider relative">
             查岗记录
             <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full opacity-50 bg-[currentColor]"></div>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6 pb-[calc(2rem+env(safe-area-inset-bottom))] relative z-10 pt-4">
        {/* Calendar Card */}
        <div className="backdrop-blur-xl rounded-[20px] p-4 shadow-sm border border-black/[0.03]" style={{ backgroundColor: themeConfig.cardBg ? themeConfig.cardBg.replace(/0\.\d+\)/, `0.8)`) : 'rgba(255,255,255,0.8)' }}>
           <div className="flex justify-between items-center mb-4 px-1" style={{ color: themeConfig.textPrimary }}>
              <button 
                 className="w-8 h-8 rounded-full flex items-center justify-center opacity-60 active:opacity-100 transition-opacity bg-black/5" 
                 onClick={prevMonth}
              >
                 <ChevronLeft size={18} className="-ml-0.5" />
              </button>
              <div className="font-semibold text-[16px] tracking-wide">
                  {selectedDate.getFullYear()}年 <span className="opacity-70">{selectedDate.getMonth() + 1}月</span>
              </div>
              <button 
                 className="w-8 h-8 rounded-full flex items-center justify-center opacity-60 active:opacity-100 transition-opacity bg-black/5" 
                 onClick={nextMonth}
              >
                 <ChevronLeft size={18} className="rotate-180 -mr-0.5" />
              </button>
           </div>
           
           <div className="grid grid-cols-7 gap-1 text-center mb-2" style={{ color: themeConfig.textSecondary }}>
              {['日','一','二','三','四','五','六'].map((d, i) => (
                 <div key={d} className={`text-[12px] font-medium ${i === 0 || i === 6 ? 'opacity-50' : 'opacity-80'}`}>{d}</div>
              ))}
           </div>
           
           <div className="grid grid-cols-7 gap-y-2 gap-x-1">
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                 <div key={`empty-${i}`} className="h-9"></div>
              ))}
              {Array.from({ length: currentMonthDays }).map((_, i) => {
                 const day = i + 1;
                 const dateStr = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day).toLocaleDateString();
                 const count = checkInCountsByDate[dateStr] || 0;
                 const isSelected = selectedDate.getDate() === day;
                 const isToday = new Date().toLocaleDateString() === dateStr;
                 
                 return (
                    <button 
                       key={day} 
                       onClick={() => handleDayClick(day)}
                       className={`h-9 rounded-[10px] flex flex-col justify-center items-center relative active:scale-90 transition-all duration-300 ${isSelected ? 'shadow-md' : 'hover:bg-black/5'}`}
                       style={{
                           backgroundColor: isSelected ? (themeConfig.textPrimary || '#333') : isToday ? 'transparent' : 'transparent',
                           color: isSelected ? (themeConfig.bg || '#fff') : isToday ? (themeConfig.textPrimary || '#333') : (themeConfig.textPrimary || '#333'),
                           border: isToday && !isSelected ? `1px solid ${themeConfig.textSecondary}40` : 'none',
                           opacity: isSelected ? 1 : 0.8
                       }}
                    >
                       <span className={`text-[14px] ${isSelected ? 'font-semibold' : 'font-medium'}`}>{day}</span>
                       <div className="absolute bottom-1 flex space-x-[2px]">
                          {Array.from({ length: Math.min(3, count) }).map((_, ci) => (
                             <div key={ci} className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: isSelected ? (themeConfig.bg || '#fff') : (themeConfig.textSecondary || '#8e8e93') }}></div>
                          ))}
                          {count > 3 && <div className="w-[3px] h-[3px] rounded-full" style={{ backgroundColor: isSelected ? (themeConfig.bg || '#fff') : (themeConfig.textSecondary || '#8e8e93') }}></div>}
                       </div>
                    </button>
                 );
              })}
           </div>
        </div>

        {/* Timeline Title */}
        <div className="flex items-center justify-between px-2 mb-4">
           <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-black/5">
                 <Clock size={16} strokeWidth={2.5} />
              </div>
              <h3 className="text-[17px] font-semibold">全天记录</h3>
           </div>
           <div className="text-[12px] font-medium px-3 py-1 rounded-full bg-black/5" style={{ color: themeConfig.textSecondary }}>
              {selectedDayCheckIns.length} 条互动
           </div>
        </div>

        {/* Timeline */}
        <div className="px-2">
           {selectedDayCheckIns.length === 0 ? (
               <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-12 backdrop-blur-md rounded-[20px]"
                  style={{ backgroundColor: themeConfig.cardBg ? themeConfig.cardBg.replace(/0\.\d+\)/, `0.5)`) : 'rgba(255,255,255,0.5)', border: `1px dashed ${themeConfig.textSecondary}30` }}
               >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-black/5">
                     <Navigation size={28} className="opacity-50" />
                  </div>
                  <p className="text-[14px] font-medium" style={{ color: themeConfig.textSecondary }}>这天没有收到查岗消息</p>
               </motion.div>
           ) : (
               <div className="space-y-5 relative">
                  <div className="absolute left-[12px] top-4 bottom-4 w-px opacity-20" style={{ backgroundImage: `linear-gradient(to bottom, ${themeConfig.textPrimary || '#333'}, transparent)` }}></div>
                  <AnimatePresence>
                     {selectedDayCheckIns.map((record, index) => (
                         <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            key={`${record.id}-${index}`} 
                            className="relative pl-10"
                         >
                             {/* Timeline Dot */}
                             <div className="absolute left-[7.5px] top-[24px] w-[9px] h-[9px] rounded-full shadow-sm" style={{ backgroundColor: themeConfig.textPrimary || '#333' }}></div>
                             
                             <div className="rounded-[18px] p-4 shadow-sm border border-black/5 backdrop-blur-md" style={{ backgroundColor: themeConfig.cardBg || '#fff' }}>
                                <div className="flex items-center justify-between mb-3 border-b border-black/[0.03] pb-2">
                                   <div className="flex items-center space-x-1.5 opacity-80" style={{ color: themeConfig.textPrimary }}>
                                      <CheckCircle2 size={16} />
                                      <span className="text-[13px] font-semibold">{mjNickname}已收到报备</span>
                                   </div>
                                   <div className="text-[12px] font-medium px-2 py-0.5 rounded-[6px] bg-black/5" style={{ color: themeConfig.textSecondary }}>
                                      {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </div>
                                </div>
                                
                                {record.text && (
                                   <div className="text-[14px] leading-relaxed tracking-wide mb-3 opacity-90 text-[currentColor]">
                                      {record.text}
                                   </div>
                                )}
                                
                                {record.imageUrl && (
                                   <div className="relative mt-2 rounded-[12px] overflow-hidden border border-black/5 bg-black/5">
                                      <img src={record.imageUrl} alt="check-in" className="w-full max-h-[220px] object-cover" />
                                   </div>
                                )}
                             </div>
                         </motion.div>
                     ))}
                  </AnimatePresence>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};
