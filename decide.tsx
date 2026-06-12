import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DecideView = ({ onClose }: { onClose: () => void }) => {
  const [tab, setTab] = useState<'tarot' | 'yesno' | 'custom'>('tarot');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [delay, setDelay] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [result, setResult] = useState<string[] | null>(null);
  const [tarotCount, setTarotCount] = useState(1);

  useEffect(() => {
    let timer: any;
    if (isDrawing && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (isDrawing && countdown === 0) {
      setIsDrawing(false);
      generateResult();
    }
    return () => clearTimeout(timer);
  }, [isDrawing, countdown]);

  const generateResult = () => {
    if (tab === 'tarot') {
      const nums = [];
      const used = new Set();
      while (nums.length < tarotCount) {
        const num = Math.floor(Math.random() * 78) + 1;
        if (!used.has(num)) {
          used.add(num);
          nums.push(num.toString());
        }
      }
      setResult(nums);
    } else if (tab === 'yesno') {
      const res = Math.random() > 0.5 ? '是' : '否';
      setResult([res]);
    } else if (tab === 'custom') {
      const validOptions = options.filter(o => o.trim() !== '');
      if (validOptions.length === 0) {
         setResult(['无有效选项']);
      } else {
         const res = validOptions[Math.floor(Math.random() * validOptions.length)];
         setResult([res]);
      }
    }
  };

  const handleStart = () => {
    if (!question.trim()) {
      alert('请先输入我想问的问题');
      return;
    }
    if (tab === 'custom' && options.filter(o => o.trim() !== '').length < 2) {
      alert('请至少输入两个选项');
      return;
    }
    setResult(null);
    if (delay === 0) {
      generateResult();
    } else {
      setCountdown(delay * 60);
      setIsDrawing(true);
    }
  };

  return (
    <div className="flex-1 w-full bg-[#F2F2F7] flex flex-col font-sans overflow-x-hidden relative h-full">
      {/* Header */}
      <div className="w-full flex items-center justify-between px-4 pb-3 sticky top-0 z-10 bg-[#F2F2F7]/80 backdrop-blur-md pt-[env(safe-area-inset-top)] mt-4">
          <button onClick={onClose} className="text-[#8e8e93] text-[15px] flex items-center active:opacity-50 transition-opacity w-[60px]">
            <ChevronLeft size={22} className="-ml-1.5" />返回
          </button>
          <span className="text-[17px] font-semibold text-black tracking-wide">帮我决定</span>
          <div className="w-[60px]"></div>
      </div>

      <div className="w-full max-w-sm mx-auto px-5 pt-4 pb-[calc(2rem+env(safe-area-inset-bottom))] flex-1 flex flex-col items-center">
         {/* Tabs */}
         <div className="flex bg-[#f2f2f7] rounded-[14px] p-1 mb-8 w-full">
            <button className={`flex-1 py-1.5 rounded-[12px] text-[14px] font-medium transition-all ${tab === 'tarot' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-black' : 'text-[#8e8e93]'}`} onClick={() => setTab('tarot')}>塔罗牌</button>
            <button className={`flex-1 py-1.5 rounded-[12px] text-[14px] font-medium transition-all ${tab === 'yesno' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-black' : 'text-[#8e8e93]'}`} onClick={() => setTab('yesno')}>是/否</button>
            <button className={`flex-1 py-1.5 rounded-[12px] text-[14px] font-medium transition-all ${tab === 'custom' ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-black' : 'text-[#8e8e93]'}`} onClick={() => setTab('custom')}>自定义</button>
         </div>

         <div className="w-full bg-white rounded-[20px] p-5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.05)] border border-black/[0.03]">
             <div className="text-[14px] text-black/60 mb-2 font-medium">我想问</div>
             <textarea 
                className="w-full bg-[#f9f9f9] rounded-[12px] p-3 text-[15px] outline-none resize-none mb-5 h-[80px]"
                placeholder="让我帮你做决定吧"
                value={question}
                onChange={e => setQuestion(e.target.value)}
             />

             {tab === 'tarot' && (
                 <div className="mb-5 space-y-3">
                     <div className="flex items-center justify-between">
                         <div className="text-[14px] text-black/60 font-medium">抽取数量 (1-6张)</div>
                         <div className="flex items-center space-x-3">
                             <button 
                               onClick={() => setTarotCount(Math.max(1, tarotCount - 1))}
                               className="w-8 h-8 rounded-full bg-[#f2f2f7] flex items-center justify-center text-[#8e8e93] active:bg-[#e5e5ea] transition-colors"
                             >
                               <ChevronLeft size={16} />
                             </button>
                             <span className="text-[15px] font-medium w-4 text-center">{tarotCount}</span>
                             <button 
                               onClick={() => setTarotCount(Math.min(6, tarotCount + 1))}
                               className="w-8 h-8 rounded-full bg-[#f2f2f7] flex items-center justify-center text-[#8e8e93] active:bg-[#e5e5ea] transition-colors"
                             >
                                 <ChevronLeft size={16} className="rotate-180" />
                             </button>
                         </div>
                     </div>
                 </div>
             )}

             {tab === 'custom' && (
                 <div className="mb-5 space-y-3">
                     <div className="text-[14px] text-black/60 font-medium">选项 (2-6个)</div>
                     {options.map((opt, idx) => (
                         <div key={idx} className="flex space-x-2">
                             <input 
                               className="flex-1 bg-[#f9f9f9] rounded-[10px] px-3 py-2 text-[14px] outline-none"
                               placeholder={`选项 ${idx + 1}`}
                               value={opt}
                               onChange={e => {
                                   const newOpts = [...options];
                                   newOpts[idx] = e.target.value;
                                   setOptions(newOpts);
                               }}
                             />
                             {options.length > 2 && (
                                 <button onClick={() => {
                                     const newOpts = [...options];
                                     newOpts.splice(idx, 1);
                                     setOptions(newOpts);
                                 }} className="p-2 text-black/30 active:text-red-400"><X size={18}/></button>
                             )}
                         </div>
                     ))}
                     {options.length < 6 && (
                         <button onClick={() => setOptions([...options, ''])} className="text-[#007AFF] text-[13px] font-medium flex items-center justify-center w-full py-2 bg-[#f2f2f7]/50 rounded-[10px]">
                            <Plus size={16} className="mr-1"/>添加选项
                         </button>
                     )}
                 </div>
             )}

             <div className="text-[14px] text-black/60 mb-3 font-medium">给未婚夫的思考时间</div>
             <div className="flex items-center justify-between mb-6 bg-[#fcfcfd] border border-gray-100 p-2.5 rounded-[12px] shadow-sm">
                 <span className="text-[14px] text-black font-medium pl-1 shrink-0">间隔</span>
                 <input 
                    type="range" 
                    min="0" 
                    max="60" 
                    step="1" 
                    value={delay} 
                    onChange={e => setDelay(parseInt(e.target.value))} 
                    className="flex-1 mx-4 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#b39dd1]"
                    style={{
                       background: `linear-gradient(to right, #b39dd1 0%, #b39dd1 ${(delay / 60) * 100}%, #e5e7eb ${(delay / 60) * 100}%, #e5e7eb 100%)`
                    }}
                 />
                 <style dangerouslySetInnerHTML={{__html: `
                    input[type=range]::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      appearance: none;
                      width: 16px;
                      height: 16px;
                      border-radius: 50%;
                      background: #b39dd1;
                      cursor: pointer;
                      border: 2px solid white;
                      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    }
                    input[type=range]::-moz-range-thumb {
                      width: 16px;
                      height: 16px;
                      border-radius: 50%;
                      background: #b39dd1;
                      cursor: pointer;
                      border: 2px solid white;
                      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                    }
                 `}} />
                 <span className="text-[14px] font-medium text-[#b39dd1] min-w-[55px] text-right pr-1 shrink-0">
                    {delay === 0 ? '立刻' : `${delay}分钟`}
                 </span>
             </div>

             <button 
                 onClick={handleStart}
                 disabled={isDrawing}
                 className={`w-full py-3.5 rounded-[14px] text-white font-medium text-[15px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-transform active:scale-95 ${isDrawing ? 'bg-black/40' : 'bg-black'}`}
             >
                 {isDrawing ? '正在决定中...' : '帮我决定'}
             </button>
         </div>

         {/* Result Overlay */}
         {(isDrawing || result !== null) && (
             <div className="fixed inset-0 z-50 bg-[#F2F2F7]/95 backdrop-blur-xl flex flex-col items-center justify-center px-6">
                 {isDrawing ? (
                     <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                     >
                         <div className="text-[15px] text-[#8e8e93] mb-4">宇宙正在为你运算答案</div>
                         <div className="text-[48px] font-light text-black tracking-widest font-mono">
                             {Math.floor(countdown / 60).toString().padStart(2, '0')}:{(countdown % 60).toString().padStart(2, '0')}
                         </div>
                     </motion.div>
                 ) : (
                     <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.8, rotateX: -20 }}
                        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                        className="w-full max-w-[280px] bg-white rounded-[24px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center p-8 border border-black/[0.04] relative overflow-hidden"
                     >
                         <div className="absolute top-0 left-0 w-full h-[6px] bg-gradient-to-r from-pink-200 via-purple-200 to-indigo-200"></div>
                         
                         <div className="text-[14px] text-[#8e8e93] mb-6 font-medium">未婚夫的答案是</div>
                         
                         <div className={`flex flex-wrap justify-center gap-3 w-full mb-8`}>
                             {result?.map((r, i) => (
                                 <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: i * 0.1, type: 'spring' }}
                                    className={`flex items-center justify-center font-medium text-black ${tab === 'tarot' ? 'bg-[#fcfcfd] border border-gray-100 rounded-xl shadow-sm w-16 h-20 text-[32px]' : 'text-[32px]'}`}
                                 >
                                    {r}
                                 </motion.div>
                             ))}
                         </div>
                         
                         <button 
                            onClick={() => setResult(null)}
                            className="px-6 py-2 bg-[#f2f2f7] text-[#8e8e93] rounded-full text-[13px] font-medium active:bg-[#e5e5ea]"
                         >
                            确认
                         </button>
                     </motion.div>
                 )}
             </div>
         )}
      </div>
    </div>
  );
};
