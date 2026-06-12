import React, { useState } from 'react';
import { ChevronLeft, Database, Download, Upload, Trash2, CheckCircle, AlertTriangle, FileJson, Loader2 } from 'lucide-react';
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
  { id: 'mailbox', name: '时空信箱', keys: ['app_mailbox_letters'], idb: false },
  { id: 'todos', name: '待办事项', keys: ['app_todos'], idb: false },
  { id: 'accounting', name: '记账本', keys: ['app_accounting'], idb: false },
  { id: 'library', name: '字卡库', keys: ['app_cardGroups'], idb: false },
  { id: 'emojis', name: '表情与动作', keys: ['app_emojis', 'app_nudges', 'app_stickers'], idb: true },
  { id: 'settings', name: '系统设置', keys: ['app_theme', 'app_name1', 'app_name2', 'app_motto', 'app_subtitle', 'app_myNickname', 'app_mjNickname', 'app_home_icon_opacity', 'app_wishlist_card_opacity', 'app_moments_style', 'app_chatKeepAlive', 'app_chatBubbleColor', 'app_chatBubbleStyle', 'app_anniversaryDate', 'app_musicList', 'app_activePlaylist', 'app_currentMusicIndex'], idb: false },
];

export const DataView: React.FC<DataViewProps> = ({ onClose, showToast }) => {
  const [confirmModal, setConfirmModal] = useState<{title: string, msg: string, onConfirm: () => void, isDanger?: boolean} | null>(null);
  const [importStatus, setImportStatus] = useState<Record<string, 'loading' | 'success' | null>>({});
  const [exportStatus, setExportStatus] = useState<Record<string, 'success' | null>>({});

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
         if (k === 'app_stickers' || (feature.idb && k !== 'app_cardGroups' && k !== 'app_emojis' && k !== 'app_nudges')) {
             const val = await get(k);
             if (val !== undefined) data.indexedDB[k] = val;
         } else {
             const val = localStorage.getItem(k);
             if (val) data.localStorage[k] = val;
         }
       }
       
       downloadJson(data, `mengjiao_backup_${feature.id}_${new Date().getTime()}.json`);
       showToast(`【${feature.name}】备份成功`);
       setExportStatus(prev => ({ ...prev, [feature.id]: 'success' }));
       setTimeout(() => setExportStatus(prev => ({ ...prev, [feature.id]: null })), 2000);
     } catch(e) {
       showToast('导出失败');
     }
  };

  // Import specific feature
  const handleImportFeature = (e: React.ChangeEvent<HTMLInputElement>, feature: typeof FEATURE_DATA[0]) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus(prev => ({ ...prev, [feature.id]: 'loading' }));

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);
        if (!data.localStorage && !data.indexedDB) {
          throw new Error("Invalid format");
        }

        setConfirmModal({
          title: `导入 ${feature.name}`,
          msg: `导入【${feature.name}】数据将覆盖当前该模块的所有记录，确定要继续吗？完成后页面将刷新。`,
          isDanger: true,
          onConfirm: async () => {
            if (data.localStorage) {
              Object.entries(data.localStorage).forEach(([k, v]) => {
                if (feature.keys.includes(k) || feature.id === 'settings') { // settings could have partials
                  localStorage.setItem(k, v as string);
                }
              });
            }
            if (data.indexedDB) {
              for (const [k, v] of Object.entries(data.indexedDB)) {
                if (feature.keys.includes(k)) {
                  await set(k, v);
                }
              }
            }
            setImportStatus(prev => ({ ...prev, [feature.id]: 'success' }));
            setTimeout(() => window.location.reload(), 500);
          }
        });
      } catch (e) {
        showToast('导入格式错误或数据无效');
        setImportStatus(prev => ({ ...prev, [feature.id]: null }));
      }
      if (e.target) e.target.value = '';
    };
    reader.onerror = () => setImportStatus(prev => ({ ...prev, [feature.id]: null }));
    reader.readAsText(file);
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
    <div className="absolute inset-0 bg-[#FAFAFA] flex flex-col overflow-x-hidden overflow-y-auto text-[13px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
        
        <div 
          className="w-full flex items-center justify-between px-4 pb-3 bg-[#FAFAFA]/80 sticky top-0 z-10 border-b border-[#E5E5EA] backdrop-blur-md"
          style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
        >
          <button onClick={onClose} className="text-[#333] flex items-center active:opacity-50 transition-opacity w-[60px]">
            <ChevronLeft size={24} className="-ml-1.5" />
          </button>
          <span className="text-[16px] font-semibold tracking-tight text-[#111]">数据与存储</span>
          <div className="w-[60px]"></div>
        </div>
        
        <div className="w-full max-w-2xl mx-auto px-4 pb-20 pt-6 space-y-8">
           <section>
              <h2 className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">全量操作</h2>
              <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                  <div className="flex items-center justify-between p-4 border-b border-[#F2F2F7] active:bg-gray-50 cursor-pointer transition-colors" onClick={handleExportAll}>
                      <div className="flex items-center gap-3">
                          <div className="w-[36px] h-[36px] rounded-[10px] bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center shrink-0">
                              <Download size={18} />
                          </div>
                          <div>
                            <div className="text-[15px] font-medium text-[#333]">全量备份 (导出)</div>
                            <div className="text-[12px] text-[#8E8E93] mt-0.5">包含所有模块的数据和设置</div>
                          </div>
                      </div>
                  </div>
                  <div className="flex items-center justify-between p-4 active:bg-gray-50 cursor-pointer relative border-b border-[#F2F2F7] transition-colors">
                      <div className="flex items-center gap-3">
                          <div className="w-[36px] h-[36px] rounded-[10px] bg-[#34C759]/10 text-[#34C759] flex items-center justify-center shrink-0">
                              <Upload size={18} />
                          </div>
                          <div>
                            <div className="text-[15px] font-medium text-[#333]">还原数据 (导入)</div>
                            <div className="text-[12px] text-[#8E8E93] mt-0.5">从全量备份文件恢复数据</div>
                          </div>
                      </div>
                      <input type="file" accept=".json" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImportAll} />
                  </div>
                  <div className="flex items-center justify-between p-4 active:bg-gray-50 cursor-pointer transition-colors" onClick={clearAllData}>
                      <div className="flex items-center gap-3">
                          <div className="w-[36px] h-[36px] rounded-[10px] bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center shrink-0">
                              <AlertTriangle size={18} />
                          </div>
                          <span className="text-[15px] font-medium text-[#FF3B30]">清除所有本地数据</span>
                      </div>
                  </div>
              </div>
           </section>

           <section>
              <h2 className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">各模块内容管理</h2>
              <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                 {FEATURE_DATA.map((feature, idx) => (
                    <div key={feature.id} className={`p-5 flex flex-col gap-4 ${idx < FEATURE_DATA.length - 1 ? 'border-b border-[#F2F2F7]' : ''}`}>
                        <div className="flex items-center text-[15px] font-medium text-[#111]">
                           <FileJson size={18} className="text-[#8e8e93] mr-2" />
                           {feature.name}
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => handleExportFeature(feature)} disabled={exportStatus[feature.id] === 'success'} className={`flex-1 py-2 flex justify-center items-center gap-1.5 rounded-[10px] text-[13px] font-medium transition-colors ${exportStatus[feature.id] === 'success' ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-[#F2F2F7] text-[#007AFF] active:bg-[#e5e5ea]'}`}>
                              {exportStatus[feature.id] === 'success' ? <><CheckCircle size={14} /> 已备份</> : <><Download size={14} /> 备份</>}
                           </button>
                           <div className="flex-1 relative">
                              <button disabled={importStatus[feature.id] === 'loading'} className={`w-full py-2 flex justify-center items-center gap-1.5 rounded-[10px] text-[13px] font-medium transition-colors ${importStatus[feature.id] === 'loading' ? 'bg-[#F2F2F7] text-[#8E8E93]' : importStatus[feature.id] === 'success' ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-[#F2F2F7] text-[#34C759] active:bg-[#e5e5ea]'}`}>
                                 {importStatus[feature.id] === 'loading' ? <><Loader2 size={14} className="animate-spin" /> 导入中</> : importStatus[feature.id] === 'success' ? <><CheckCircle size={14} /> 导入成功</> : <><Upload size={14} /> 导入</>}
                              </button>
                              <input type="file" accept=".json" className="absolute inset-0 opacity-0 cursor-pointer" title="导入模块数据" onChange={(e) => handleImportFeature(e, feature)} disabled={importStatus[feature.id] === 'loading'} />
                            </div>
                            <button onClick={() => handleClearFeature(feature)} className="flex-1 py-2 flex justify-center items-center gap-1.5 bg-[#FF3B30]/10 rounded-[10px] text-[#FF3B30] text-[13px] font-medium active:bg-[#FF3B30]/20 transition-colors">
                              <Trash2 size={14} /> 清除
                           </button>
                        </div>
                    </div>
                 ))}
              </div>
           </section>

           <p className="text-[12px] text-[#8e8e93] mt-6 px-2 leading-relaxed opacity-80 text-center">
              所有数据均保存在本地浏览器缓存中。请定期备份重要数据，防止丢失。
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
