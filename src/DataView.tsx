import React, { useState, useEffect } from 'react';
import { ChevronLeft, Database, Download, Upload, Trash2, CheckCircle, AlertTriangle, FileJson, Loader2 } from 'lucide-react';
import { get, set, keys, del, clear } from 'idb-keyval';
import { motion, AnimatePresence } from 'motion/react';

interface DataViewProps {
  onClose: () => void;
  showToast: (msg: string) => void;
}

const FEATURE_DATA = [
  { 
    id: 'chat', 
    name: '聊天', 
    keys: ['app_chatMessages'],
    canImport: true 
  },
  { 
    id: 'library', 
    name: '字卡库及音乐', 
    keys: [
      'app_cardGroups', 
      'app_emojis', 
      'app_stickers', 
      'app_nudges', 
      'app_voiceCards', 
      'app_musicList', 
      'app_activePlaylist', 
      'app_currentMusicIndex',
      'app_keepalive_audio'
    ],
    canImport: true 
  },
  { 
    id: 'settings', 
    name: '系统设置', 
    keys: [
      'app_theme', 
      'app_name1', 
      'app_name2', 
      'app_motto', 
      'app_subtitle', 
      'app_myNickname', 
      'app_mjNickname', 
      'app_myHandle', 
      'app_mjHandle', 
      'app_home_icon_opacity', 
      'app_wishlist_card_opacity', 
      'app_moments_style', 
      'app_chatKeepAlive', 
      'app_chatBubbleColor', 
      'app_chatBubbleStyle', 
      'app_anniversaryDate', 
      'app_chatCss', 
      'app_chatFont', 
      'app_keepalive_icon', 
      'app_wallpaper', 
      'app_profileBg', 
      'app_avatar1', 
      'app_avatar2', 
      'app_chatBg', 
      'app_chatAvatar1', 
      'app_chatAvatar2',
      'app_charId',
      'app_chatNudgeText',
      'app_chatPushNotify'
    ],
    canImport: true 
  },
  { 
    id: 'accounting', 
    name: '记账本', 
    keys: ['app_accounting_records'],
    canImport: false 
  },
  { 
    id: 'wishlist', 
    name: '心愿单', 
    keys: ['app_wishlist', 'app_wishlist_bg'],
    canImport: false 
  },
  { 
    id: 'todos', 
    name: '待办事项', 
    keys: ['app_todos', 'app_todo_config'],
    canImport: false 
  },
  { 
    id: 'checkins', 
    name: '查岗打卡', 
    keys: ['app_checkins', 'app_checkins_bg'],
    canImport: false 
  },
  { 
    id: 'moods', 
    name: '心情便签', 
    keys: ['app_mood_notes'],
    canImport: false 
  },
  { 
    id: 'mailbox', 
    name: '信箱', 
    keys: ['app_mailbox_letters'],
    canImport: false 
  },
  { 
    id: 'moments', 
    name: '朋友圈动态', 
    keys: ['app_moments', 'app_moments_bg', 'last_mengjiao_post'],
    canImport: false 
  },
];

const getGroupForKey = (key: string): string => {
  if (['app_chatMessages'].includes(key)) {
    return 'chat';
  }
  if (['app_mailbox_letters'].includes(key)) {
    return 'mailbox';
  }
  if (['app_moments', 'app_moments_bg', 'last_mengjiao_post'].includes(key)) {
    return 'moments';
  }
  if ([
    'app_accounting_records', 
    'app_wishlist', 
    'app_wishlist_bg', 
    'app_todos', 
    'app_todo_config', 
    'app_checkins', 
    'app_checkins_bg', 
    'app_mood_notes'
  ].includes(key)) {
    return 'tools';
  }
  if ([
    'app_cardGroups', 
    'app_emojis', 
    'app_stickers', 
    'app_nudges', 
    'app_voiceCards', 
    'app_musicList', 
    'app_activePlaylist', 
    'app_currentMusicIndex',
    'app_keepalive_audio'
  ].includes(key)) {
    return 'library';
  }
  return 'settings';
};

export const DataView: React.FC<DataViewProps> = ({ onClose, showToast }) => {
  const [confirmModal, setConfirmModal] = useState<{title: string, msg: string, onConfirm: () => void, isDanger?: boolean} | null>(null);
  const [importStatus, setImportStatus] = useState<Record<string, 'loading' | 'success' | null>>({});
  const [exportStatus, setExportStatus] = useState<Record<string, 'success' | null>>({});

  const [calculating, setCalculating] = useState(true);
  const [totalSize, setTotalSize] = useState(0);
  const [categories, setCategories] = useState<{ id: string; name: string; color: string; size: number }[]>([]);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateStorage = async () => {
    setCalculating(true);
    try {
      let chatSize = 0;
      let mailboxSize = 0;
      let momentsSize = 0;
      let toolsSize = 0;
      let librarySize = 0;
      let settingsSize = 0;

      const getValSize = (val: any): number => {
        if (val === undefined || val === null) return 0;
        if (typeof val === 'string') {
          return new Blob([val]).size;
        }
        try {
          return new Blob([JSON.stringify(val)]).size;
        } catch (e) {
          return 0;
        }
      };

      const addSizeToGroup = (key: string, size: number) => {
        const group = getGroupForKey(key);
        if (group === 'chat') chatSize += size;
        else if (group === 'mailbox') mailboxSize += size;
        else if (group === 'moments') momentsSize += size;
        else if (group === 'tools') toolsSize += size;
        else if (group === 'library') librarySize += size;
        else if (group === 'settings') settingsSize += size;
      };

      // 1. Scan LocalStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('app_')) {
          const val = localStorage.getItem(key);
          if (val) {
            const size = getValSize(val);
            addSizeToGroup(key, size);
          }
        }
      }

      // 2. Scan IndexedDB
      const idbKeys = await keys();
      for (const key of idbKeys) {
        if (typeof key === 'string' && key.startsWith('app_')) {
          const val = await get(key);
          if (val !== undefined) {
            const size = getValSize(val);
            addSizeToGroup(key, size);
          }
        }
      }

      const total = chatSize + mailboxSize + momentsSize + toolsSize + librarySize + settingsSize;
      setTotalSize(total);

      setCategories([
        { id: 'chat', name: '聊天', color: '#007AFF', size: chatSize },
        { id: 'mailbox', name: '信箱', color: '#5856D6', size: mailboxSize },
        { id: 'moments', name: '朋友圈动态', color: '#34C759', size: momentsSize },
        { id: 'tools', name: '伴侣小工具', color: '#FF9500', size: toolsSize },
        { id: 'library', name: '字卡库及音乐', color: '#FF2D55', size: librarySize },
        { id: 'settings', name: '系统设置', color: '#8E8E93', size: settingsSize }
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    calculateStorage();
  }, []);

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
         // Check IDB
         const idbVal = await get(k);
         if (idbVal !== undefined) {
           data.indexedDB[k] = idbVal;
         }
         // Check LocalStorage
         const lsVal = localStorage.getItem(k);
         if (lsVal !== null) {
           data.localStorage[k] = lsVal;
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
                if (feature.keys.includes(k)) {
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
                  await del(k);
                  localStorage.removeItem(k);
              }
              showToast(`【${feature.name}】已清空`);
              await calculateStorage();
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
              <h2 className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">存储空间</h2>
              <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                  {calculating ? (
                      <div className="flex flex-col items-center justify-center py-6 text-[#8E8E93] gap-2">
                          <Loader2 size={24} className="animate-spin text-[#007AFF]" />
                          <span className="text-[12px]">正在计算已用空间...</span>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {/* Heading */}
                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-3 border-b border-[#F2F2F7]">
                              <div className="flex items-baseline gap-2 shrink-0">
                                  <span className="text-[26px] font-extrabold text-[#111] tracking-tight font-mono">{formatSize(totalSize)}</span>
                                  <span className="text-[13px] text-[#8E8E93] font-medium">已使用</span>
                              </div>
                              <div className="text-[12px] text-[#8E8E93] font-normal sm:text-right mt-1 sm:mt-0 leading-normal">
                                  无可用上限 <span className="text-[#AEAEB2]">(由浏览器内核动态配额)</span>
                              </div>
                          </div>

                          {/* Progress bar stack */}
                          <div className="h-[12px] w-full bg-[#E5E5EA] rounded-full overflow-hidden flex">
                              {totalSize === 0 ? (
                                  <div className="h-full bg-gray-200 w-full" />
                              ) : (
                                  categories.map(cat => {
                                      const pct = totalSize > 0 ? (cat.size / totalSize) * 100 : 0;
                                      if (pct === 0) return null;
                                      return (
                                          <div 
                                              key={cat.id} 
                                              style={{ 
                                                  width: `${pct}%`,
                                                  backgroundColor: cat.color
                                              }} 
                                              className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
                                              title={`${cat.name}: ${formatSize(cat.size)} (${pct.toFixed(1)}%)`}
                                          />
                                      );
                                  })
                              )}
                          </div>

                          {/* Legend / Breakdown of each group */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                              {categories.map(cat => (
                                  <div key={cat.id} className="flex justify-between items-center text-[12.5px] p-1 h-7">
                                      <div className="flex items-center gap-2">
                                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                          <span className="text-[#333] truncate max-w-[150px]">{cat.name}</span>
                                      </div>
                                      <span className="text-[#8E8E93] font-mono font-medium">{formatSize(cat.size)}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
           </section>

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
                           {feature.canImport && (
                             <div className="flex-1 relative">
                                <button disabled={importStatus[feature.id] === 'loading'} className={`w-full py-2 flex justify-center items-center gap-1.5 rounded-[10px] text-[13px] font-medium transition-colors ${importStatus[feature.id] === 'loading' ? 'bg-[#F2F2F7] text-[#8E8E93]' : importStatus[feature.id] === 'success' ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-[#F2F2F7] text-[#34C759] active:bg-[#e5e5ea]'}`}>
                                   {importStatus[feature.id] === 'loading' ? <><Loader2 size={14} className="animate-spin" /> 导入中</> : importStatus[feature.id] === 'success' ? <><CheckCircle size={14} /> 导入成功</> : <><Upload size={14} /> 导入</>}
                                </button>
                                <input type="file" accept=".json" className="absolute inset-0 opacity-0 cursor-pointer" title="导入模块数据" onChange={(e) => handleImportFeature(e, feature)} disabled={importStatus[feature.id] === 'loading'} />
                              </div>
                           )}
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
