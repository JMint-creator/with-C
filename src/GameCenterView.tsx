import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Wallet, Gamepad2, Plane, Sparkles, AlertCircle } from 'lucide-react';
import { useIDBState } from './utils';
import { UnoGameView } from './UnoGameView';
import { BalatroGameView } from './BalatroGameView';



interface Record {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  note: string;
  timestamp: number;
}

export function GameCenterView({ 
  onClose,
  themeConfig,
  bgImage
}: { 
  onClose: () => void;
  themeConfig: any;
  bgImage: string;
}) {
  const [virtualRecords, setVirtualRecords] = useIDBState<Record[]>('app_virtual_accounting_records', []);
  const [toast, setToast] = useState('');
  const [activeGame, setActiveGame] = useState<string | null>(null);

  const virtualBalance = virtualRecords.reduce((acc, curr) => {
    return curr.type === 'income' ? acc + curr.amount : acc - curr.amount;
  }, 0);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const handlePurchase = (gameName: string, cost: number, onSuccess?: () => void) => {
    if (virtualBalance < cost) {
      showToast(`余额不足，还需要 ${cost - virtualBalance} 元`);
      return;
    }
    
    // Deduct cost
    const newRecord: Record = {
      id: Date.now().toString(),
      type: 'expense',
      amount: cost,
      category: 'entertainment',
      note: `购买${gameName}门票/解锁`,
      timestamp: Date.now()
    };
    
    setVirtualRecords([newRecord, ...virtualRecords]);
    showToast(`成功解锁 ${gameName}！(扣除 ${cost} 元)`);
    
    if (onSuccess) {
      setTimeout(() => onSuccess(), 1000);
    }
  };



  if (activeGame === 'uno') {
    return <UnoGameView onClose={() => setActiveGame(null)} themeConfig={themeConfig} />;
  }

  if (activeGame === 'balatro') {
    return <BalatroGameView onClose={() => setActiveGame(null)} themeConfig={themeConfig} />;
  }

  return (

    <div 
      className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 text-[14px]" 
      style={{ 
        color: themeConfig.textPrimary || '#333',
        backgroundColor: themeConfig.bg || '#F2F2F7',
        backgroundImage: bgImage !== 'none' ? bgImage : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background Graphic overlay if no image */}
      {bgImage === 'none' && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-50">
           <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-b from-[currentColor] to-transparent opacity-10 blur-3xl"></div>
        </div>
      )}
      
      {/* Header */}
      <div className="relative pt-[env(safe-area-inset-top)] shadow-sm z-10 shrink-0 border-b border-black/5" style={{ backgroundColor: bgImage !== 'none' ? (themeConfig.bg ? themeConfig.bg + 'cc' : '#f2f2f7cc') : (themeConfig.bg || '#f2f2f7'), backdropFilter: bgImage !== 'none' ? 'blur(12px)' : 'none' }}>
        <div className="flex justify-between items-center px-4 h-14">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-transform -ml-2">
            <ChevronLeft size={24} className="mr-0.5" />
          </button>
          <div className="text-[17px] font-semibold tracking-wider relative">
             游戏中心
             <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full opacity-50 bg-[currentColor]"></div>
          </div>
          <div className="w-10 h-10 flex items-center justify-center">
             <Gamepad2 size={20} className="opacity-70" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto flex flex-col px-4 pt-4 pb-24 space-y-5">
        
        {/* Wallet Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl rounded-[20px] p-4 flex items-center justify-between shadow-sm border border-black/[0.03]" style={{ backgroundColor: themeConfig.cardBg ? themeConfig.cardBg.replace(/0\.\d+\)/, `0.8)`) : 'rgba(255,255,255,0.8)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/[0.03] text-inherit opacity-60">
              <Wallet size={20} />
            </div>
            <div>
              <div className="text-[13px] text-inherit opacity-60 font-medium">虚拟余额</div>
              <div className="text-[17px] font-bold text-inherit opacity-90 tracking-tight">¥ {virtualBalance.toFixed(2)}</div>
            </div>
          </div>
          <div className="text-[12px] text-inherit opacity-40 max-w-[120px] text-right leading-relaxed">
            可用于购买游戏门票<br/>或解锁剧情
          </div>
        </motion.div>

        {/* Games List */}
        <div className="space-y-4">
          <div className="text-[14px] font-medium text-inherit opacity-60 ml-2 mb-2">全部游戏</div>

          {/* Game 1: UNO */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl rounded-[20px] p-5 flex flex-col shadow-sm border border-black/[0.03]" style={{ backgroundColor: themeConfig.cardBg ? themeConfig.cardBg.replace(/0\.\d+\)/, `0.8)`) : 'rgba(255,255,255,0.8)' }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center bg-[#FFEBEE] text-[#D32F2F]">
                <div className="text-[20px] font-black italic tracking-tighter">UNO</div>
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-semibold text-inherit opacity-90">UNO 纸牌</div>
                <div className="text-[12px] text-inherit opacity-60 mt-0.5">原版 UNO 规则，经典抽牌对战</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/[0.03]">
              <div className="text-[14px] font-medium text-inherit opacity-80">
                门票: ¥ 520 / 次
              </div>
              <button 
                onClick={() => handlePurchase('UNO 纸牌', 520, () => setActiveGame('uno'))}
                className="px-5 py-1.5 rounded-full text-[#333] text-[13px] font-medium active:opacity-80 transition-opacity"
                style={{ backgroundColor: themeConfig.primaryColor }}
              >
                购买门票
              </button>
            </div>
          </motion.div>

          {/* Game 2: 小丑牌 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="backdrop-blur-xl rounded-[20px] p-5 flex flex-col shadow-sm border border-black/[0.03]" style={{ backgroundColor: themeConfig.cardBg ? themeConfig.cardBg.replace(/0\.\d+\)/, `0.8)`) : 'rgba(255,255,255,0.8)' }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center bg-[#FFF8E1] text-[#F57F17]">
                <span className="text-[26px]">🃏</span>
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-semibold text-inherit opacity-90">小丑牌 (Balatro)</div>
                <div className="text-[12px] text-inherit opacity-60 mt-0.5">扑克构建与肉鸽的奇妙结合</div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/[0.03]">
              <div className="text-[14px] font-medium text-inherit opacity-80">
                门票: ¥ 666 / 次
              </div>
              <button 
                onClick={() => handlePurchase('小丑牌', 666, () => setActiveGame('balatro'))}
                className="px-5 py-1.5 rounded-full text-[#333] text-[13px] font-medium active:opacity-80 transition-opacity"
                style={{ backgroundColor: themeConfig.primaryColor }}
              >
                购买门票
              </button>
            </div>
          </motion.div>

          {/* Game 3: 飞行棋 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-xl rounded-[20px] p-5 flex flex-col shadow-sm border border-black/[0.03]" style={{ backgroundColor: themeConfig.cardBg ? themeConfig.cardBg.replace(/0\.\d+\)/, `0.8)`) : 'rgba(255,255,255,0.8)' }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center bg-[#E8F0FE] text-[#1A73E8]">
                <Plane size={26} />
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-semibold text-inherit opacity-90">情侣飞行棋</div>
                <div className="text-[12px] text-inherit opacity-60 mt-0.5">专属两人的私密互动小游戏</div>
              </div>
            </div>
            
            <div className="bg-black/[0.03] rounded-[12px] p-3 mb-4 flex items-start gap-2 border border-transparent">
              <AlertCircle size={15} className="text-inherit opacity-40 mt-[1px] shrink-0" />
              <div className="text-[12px] text-inherit opacity-60 leading-relaxed">
                游戏内容暂未开放。您可以先消耗虚拟余额预购门票，敬请期待！
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/[0.03]">
              <div className="text-[14px] font-medium text-inherit opacity-80">
                门票: ¥ 999 / 次
              </div>
              <button 
                onClick={() => handlePurchase('情侣飞行棋', 999)}
                className="px-5 py-1.5 rounded-full text-[#333] text-[13px] font-medium active:opacity-80 transition-opacity"
                style={{ backgroundColor: themeConfig.primaryColor }}
              >
                购买门票
              </button>
            </div>
          </motion.div>

          {/* Game 4: IF线模拟器 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="backdrop-blur-xl rounded-[20px] p-5 flex flex-col shadow-sm border border-black/[0.03]" style={{ backgroundColor: themeConfig.cardBg ? themeConfig.cardBg.replace(/0\.\d+\)/, `0.8)`) : 'rgba(255,255,255,0.8)' }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center bg-[#F3E8FD] text-[#9333EA]">
                <Sparkles size={26} />
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-semibold text-inherit opacity-90">IF线模拟器</div>
                <div className="text-[12px] text-inherit opacity-60 mt-0.5">文字解密与平行时空的选择</div>
              </div>
            </div>
            <div className="bg-black/[0.03] rounded-[12px] p-3 mb-4 flex items-start gap-2 border border-transparent">
              <AlertCircle size={15} className="text-inherit opacity-40 mt-[1px] shrink-0" />
              <div className="text-[12px] text-inherit opacity-60 leading-relaxed">
                故事仍在编写中。您可以先消耗虚拟余额解锁第一章预告片。
              </div>
            </div>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/[0.03]">
              <div className="text-[14px] font-medium text-inherit opacity-80">
                解锁: ¥ 1314 / 章节
              </div>
              <button 
                onClick={() => handlePurchase('IF线模拟器', 1314)}
                className="px-5 py-1.5 rounded-full text-[#333] text-[13px] font-medium active:opacity-80 transition-opacity"
                style={{ backgroundColor: themeConfig.primaryColor }}
              >
                解锁章节
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-800/90 text-white px-6 py-3 rounded-full text-[14px] shadow-lg whitespace-nowrap z-[100] backdrop-blur-sm"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
