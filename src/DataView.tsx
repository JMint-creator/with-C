import React, { useState } from 'react';
import { ChevronLeft, Database, Download, Upload, Trash2, CheckCircle, AlertTriangle, FileJson } from 'lucide-react';
import { get, set, keys, del, clear } from 'idb-keyval';
import { motion, AnimatePresence } from 'motion/react';

interface DataViewProps {
  onClose: () => void;
  showToast: (msg: string) => void;
}

const FEATURE_DATA = [
  { id: 'chat', name: '聊天记录', keys: ['app_chatMessages'], idb: true },
  { id: 'moments', name: '朋友圈数据', keys: ['app_moments'], idb: true },
  { id: 'wishlist', name: '心愿单数据', keys: ['app_wishlist'], idb: true },
  { id: 'checkins', name: '打卡记录', keys: ['app_checkins'], idb: true },
  { id: 'library', name: '字卡库与表情', keys: ['app_cardGroups', 'app_emojis', 'app_nudges', 'app_stickers'], idb: true }, // stickers are in idb, others local
];

export const DataView: React.FC<DataViewProps> = ({ onClose, showToast }) => {
  const [confirmModal, setConfirmModal] = useState<{title: string, msg: string, onConfirm: () => void, isDanger?: boolean} | null>(null);

  // Export full data
  const handleExportAll = async () => {
    try {
      const data: any = { localStorage: {}, indexedDB: {} };
      
      // LocalStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('app_')) {
          const val = localStorage.getItem(key);
          if (val) data.localStorage[key] = val;
        }
      }
      
      // IndexedDB
      const idbKeys = await keys();
      for (const key of idbKeys) {
        if (typeof key === 'string' && key.startsWith('app_')) {
          const val = await get(key);
          if (val !== undefined) data.indexedDB[key] = val;
        }
      }

      downloadJson(data, `mengjiao_backup_all_${new Date().getTime()}.json`);
      showToast('全量备份导出成功');
    } catch (e) {
      console.error(e);
      showToast('导出失败');
    }
  };

  // Import full data
  const handleImportAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        if (!data.localStorage && !data.indexedDB) {
          throw new Error("Invalid format");
        }

        setConfirmModal({
          title: '全量恢复数据',
          msg: '导入数据将覆盖当前的所有记录和设置，确定要继续吗？导入完成后页面将刷新。',
          isDanger: true,
          onConfirm: async () => {
            if (data.localStorage) {
              Object.entries(data.localStorage).forEach(([k, v]) => {
                localStorage.setItem(k, v as string);
              });
            }
            if (data.indexedDB) {
              for (const [k, v] of Object.entries(data.indexedDB)) {
                await set(k, v);
              }
            }
            window.location.reload();
          }
        });
      } catch (e) {
        showToast('导入格式错误或数据无效');
      }
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Export specific feature
  const handleExportFeature = async (feature: typeof FEATURE_DATA[0]) => {
     try {
       const data: any = { localStorage: {}, indexedDB: {} };
       
       for (const k of feature.keys) {
         if (k === 'app_stickers' || feature.idb && k !== 'app_cardGroups' && k !== 'app_emojis' && k !== 'app_nudges') {
             const val = await get(k);
             if (val !== undefined) data.indexedDB[k] = val;
         } else {
             const val = localStorage.getItem(k);
             if (val) data.localStorage[k] = val;
         }
       }
       
       downloadJson(data, `mengjiao_backup_${feature.id}_${new Date().getTime()}.json`);
       showToast(`【${feature.name}】备份成功`);
     } catch(e) {
       showToast('导出失败');
     }
  };

  // Clear specific feature
  const handleClearFeature = (feature: typeof FEATURE_DATA[0]) => {
      setConfirmModal({
          title: `清除${feature.name}`,
          msg: `确定要清空【${feature.name}】吗？此操作不可逆。`,
          isDanger: true,
          onConfirm: async () => {
              for (const k of feature.keys) {
                 if (k === 'app_stickers' || feature.idb && k !== 'app_cardGroups' && k !== 'app_emojis' && k !== 'app_nudges') {
                     await del(k);
                 } else {
                     localStorage.removeItem(k);
                 }
              }
              showToast(`【${feature.name}】已清空，请重新进入页面生效`);
          }
      });
  };

  const clearAllData = () => {
    setConfirmModal({
        title: '清除所有记录',
        msg: '确定要清除所有数据和设置吗？此操作不可逆。',
        isDanger: true,
        onConfirm: async () => {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('app_')) {
                    localStorage.removeItem(key);
                }
            }
            await clear();
            window.location.reload();
        }
    });
  };

  const downloadJson = (data: any, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
  };

  return (
    <div className="flex-1 w-full bg-[#F2F2F7] flex flex-col min-h-[100dvh] overflow-x-hidden relative text-[12px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
        
        <div 
          className="w-full flex items-center justify-between px-3 pb-3 bg-[#F2F2F7] sticky top-0 z-10 border-b border-[#c6c6c8]/50 shadow-sm"
          style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
        >
          <button onClick={onClose} className="text-[#007AFF] text-[15px] flex items-center active:opacity-50 transition-opacity w-[60px]">
            <ChevronLeft size={24} className="-ml-1.5" />返回
          </button>
          <span className="text-[15px] font-semibold text-black">数据管理</span>
          <div className="w-[60px]"></div>
        </div>
        
        <div className="w-full max-w-md mx-auto px-4 pb-12 pt-6">
           <div className="mb-6">
              <div className="text-[11px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">全量操作</div>
              <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                 <div className="flex items-center justify-between p-3 border-b border-[#E5E5EA] active:bg-gray-50 cursor-pointer" onClick={handleExportAll}>
                     <div className="flex items-center">
                         <div className="w-[30px] h-[30px] rounded-[8px] bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center mr-3">
                             <Download size={16} />
                         </div>
                         <span className="text-[14px] text-[#333]">全量备份 (导出)</span>
                     </div>
                 </div>
                 <div className="flex items-center justify-between p-3 active:bg-gray-50 cursor-pointer relative border-b border-[#E5E5EA]">
                     <div className="flex items-center">
                         <div className="w-[30px] h-[30px] rounded-[8px] bg-[#34C759]/10 text-[#34C759] flex items-center justify-center mr-3">
                             <Upload size={16} />
                         </div>
                         <span className="text-[14px] text-[#333]">还原数据 (导入)</span>
                     </div>
                     <input type="file" accept=".json" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImportAll} />
                 </div>
                 <div className="flex items-center justify-between p-3 active:bg-gray-50 cursor-pointer" onClick={clearAllData}>
                     <div className="flex items-center">
                         <div className="w-[30px] h-[30px] rounded-[8px] bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center mr-3">
                             <AlertTriangle size={16} />
                         </div>
                         <span className="text-[14px] text-[#FF3B30]">清除所有本地数据</span>
                     </div>
                 </div>
              </div>
           </div>

           <div className="mb-6">
              <div className="text-[11px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">模块数据管理</div>
              <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                 {FEATURE_DATA.map((feature, idx) => (
                    <div key={feature.id} className={`p-4 flex flex-col gap-3 ${idx < FEATURE_DATA.length - 1 ? 'border-b border-[#E5E5EA]' : ''}`}>
                        <div className="flex items-center text-[14px] font-medium text-[#333]">
                           <FileJson size={16} className="text-[#8e8e93] mr-2" />
                           {feature.name}
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => handleExportFeature(feature)} className="flex-1 py-1.5 flex justify-center items-center gap-1.5 bg-[#F2F2F7] rounded-[8px] text-[#007AFF] text-[13px] active:bg-[#e5e5ea] transition-colors">
                              <Download size={14} /> 备份
                           </button>
                           <button onClick={() => handleClearFeature(feature)} className="flex-1 py-1.5 flex justify-center items-center gap-1.5 bg-[#FF3B30]/10 rounded-[8px] text-[#FF3B30] text-[13px] active:bg-[#FF3B30]/20 transition-colors">
                              <Trash2 size={14} /> 清除
                           </button>
                        </div>
                    </div>
                 ))}
                 
              </div>
           </div>

           <p className="text-[11px] text-[#8e8e93] mt-4 ml-4 leading-relaxed opacity-80">
              提示：部分全量备份可能包含大量数据及图片，导出文件较大。
           </p>
        </div>

        <AnimatePresence>
            {confirmModal && (
                <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center px-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-[16px] w-full max-w-[280px] p-5 shadow-2xl relative"
                    >
                        <h3 className="text-[16px] font-bold text-center mb-2">{confirmModal.title}</h3>
                        <p className="text-[13px] text-[#666] text-center mb-6 leading-relaxed">
                            {confirmModal.msg}
                        </p>
                        <div className="flex gap-3">
                            <button 
                                className="flex-1 py-2.5 rounded-[10px] bg-[#f2f2f7] text-[#007AFF] font-medium text-[14px] active:bg-[#e5e5ea]" 
                                onClick={() => setConfirmModal(null)}
                            >取消</button>
                            <button 
                                className={`flex-1 py-2.5 rounded-[10px] font-medium text-[14px] active:opacity-80 text-white ${confirmModal.isDanger ? 'bg-[#FF3B30]' : 'bg-[#007AFF]'}`} 
                                onClick={() => {
                                    confirmModal.onConfirm();
                                    setConfirmModal(null);
                                }}
                            >确定</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </div>
  );
};
