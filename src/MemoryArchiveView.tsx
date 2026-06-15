import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  Trash2, 
  Edit3, 
  Plus, 
  X, 
  Search, 
  BookOpen, 
  Sparkles, 
  Check, 
  Archive,
  Heart,
  Brain,
  MessageSquareHeart,
  Activity,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalState } from './utils';

export interface CustomThought {
  id: string;
  category: 'attachment' | 'curiosity' | 'possessiveness' | 'responsibility' | 'pressure' | 'other';
  type: 'core' | 'whisper';
  text: string;
  actionName?: string;
  logText?: string;
}

const CATEGORY_MAP = {
  attachment: { label: '依恋', color: 'bg-pink-100 text-pink-700 border-pink-200' },
  curiosity: { label: '好奇', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  possessiveness: { label: '欲望', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  responsibility: { label: '责任', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  pressure: { label: '压力', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  other: { label: '日常常态', color: 'bg-stone-100 text-stone-700 border-stone-200' }
};

const TYPE_MAP = {
  core: { label: '核心互动组', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  whisper: { label: '碎碎念', color: 'bg-purple-100 text-purple-700 border-purple-200' }
};

export const MemoryArchiveView = ({ onClose, themeConfig, checkinsBg, onReturnToCheckin }: {
  onClose: () => void;
  themeConfig: any;
  checkinsBg?: string;
  onReturnToCheckin?: () => void;
}) => {
  const [customThoughts, setCustomThoughts] = useLocalState<CustomThought[]>('app_custom_thought_pool', []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingThought, setEditingThought] = useState<CustomThought | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilterCategory, setActiveFilterCategory] = useState<string>('all');
  const [activeFilterType, setActiveFilterType] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form Fields
  const [formCategory, setFormCategory] = useState<CustomThought['category']>('attachment');
  const [formType, setFormType] = useState<CustomThought['type']>('core');
  const [formText, setFormText] = useState('');
  const [formActionName, setFormActionName] = useState('');
  const [formLogText, setFormLogText] = useState('');

  // Open add modal
  const handleOpenAdd = () => {
    setEditingThought(null);
    setFormCategory('attachment');
    setFormType('core');
    setFormText('');
    setFormActionName('听听Charlie的心声');
    setFormLogText('');
    setShowAddModal(true);
  };

  // Open edit modal
  const handleOpenEdit = (thought: CustomThought) => {
    setEditingThought(thought);
    setFormCategory(thought.category);
    setFormType(thought.type);
    setFormText(thought.text);
    setFormActionName(thought.actionName || '听听Charlie的心声');
    setFormLogText(thought.logText || '');
    setShowAddModal(true);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) return;

    const finalActionName = formType === 'core' ? (formActionName.trim() || '听听Charlie的心声') : undefined;
    const finalLogText = formType === 'core' ? (formLogText.trim() || `听到了未婚夫脑海里的声音...`) : undefined;

    if (editingThought) {
      // Edit mode
      setCustomThoughts(prev => prev.map(t => t.id === editingThought.id ? {
        ...t,
        category: formCategory,
        type: formType,
        text: formText.trim(),
        actionName: finalActionName,
        logText: finalLogText
      } : t));
    } else {
      // Create mode
      const newThought: CustomThought = {
        id: 'user_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        category: formCategory,
        type: formType,
        text: formText.trim(),
        actionName: finalActionName,
        logText: finalLogText
      };
      setCustomThoughts(prev => [newThought, ...prev]);
    }

    setShowAddModal(false);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    setCustomThoughts(prev => prev.filter(t => t.id !== id));
    if (deletingId === id) {
      setDeletingId(null);
    }
  };

  // Filter and search
  const filteredThoughts = useMemo(() => {
    return customThoughts.filter(t => {
      const matchSearch = t.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (t.actionName && t.actionName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.logText && t.logText.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchCategory = activeFilterCategory === 'all' || t.category === activeFilterCategory;
      const matchType = activeFilterType === 'all' || t.type === activeFilterType;

      return matchSearch && matchCategory && matchType;
    });
  }, [customThoughts, searchQuery, activeFilterCategory, activeFilterType]);

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
      {/* Background Graphic overlay if no image to prevent jarring borders */}
      {!checkinsBg && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-50">
           <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-b from-[currentColor] to-transparent opacity-10 blur-3xl"></div>
        </div>
      )}

      {/* Header */}
      <div 
        className="relative pt-[env(safe-area-inset-top)] border-b border-black/5 z-10 shrink-0" 
        style={{ 
          backgroundColor: checkinsBg ? (themeConfig.bg ? themeConfig.bg + 'cc' : '#f2f2f7cc') : (themeConfig.bg || '#f2f2f7'), 
          backdropFilter: 'blur(16px)' 
        }}
      >
        <div className="flex justify-between items-center px-4 h-14">
          <button 
            onClick={onReturnToCheckin || onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-transform -ml-2"
          >
            <ChevronLeft size={24} className="mr-0.5" />
          </button>
          
          <div className="flex items-center gap-1.5 text-[17px] font-semibold tracking-wider">
            <Archive size={18} className="text-stone-700" />
            记忆档案馆
          </div>

          <button 
            onClick={handleOpenAdd}
            className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-all text-emerald-600 bg-emerald-50 hover:bg-emerald-100/50"
            title="添加定制文案"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Filter and search bar with Glassmorphic styling */}
      <div 
        className="px-4 py-3 border-b border-black/5 z-10 shrink-0 flex flex-col gap-2.5 backdrop-blur-md"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
      >
        {/* Search */}
        <div className="relative w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 opacity-40" />
          <input 
            type="text"
            placeholder="搜索你定制的心愿、动作或心情记录..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-full border border-black/5 bg-white/70 backdrop-blur-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-200 transition-all font-medium placeholder:text-stone-400 text-stone-800"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 transform -translate-y-1/2 bg-black/5 hover:bg-black/10 rounded-full p-0.5"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveFilterCategory('all')}
            className={`px-3 py-1 rounded-full text-[12px] font-semibold tracking-wide border transition-all shrink-0 ${activeFilterCategory === 'all' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white/60 text-stone-600 border-black/5 hover:bg-white/80'}`}
          >
            全归属
          </button>
          {Object.entries(CATEGORY_MAP).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setActiveFilterCategory(key)}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold tracking-wide border transition-all shrink-0 ${activeFilterCategory === key ? 'bg-stone-800 text-white border-stone-800 shadow-sm' : 'bg-white/60 text-stone-600 border-black/5 hover:bg-white/80'}`}
            >
              {value.label}
            </button>
          ))}
        </div>

        {/* Type Tabs */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveFilterType('all')}
            className={`px-3 py-1 rounded-lg text-[11.5px] font-bold tracking-wider transition-all ${activeFilterType === 'all' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'text-stone-500 hover:opacity-100 opacity-70'}`}
          >
            全部类别
          </button>
          <button
            onClick={() => setActiveFilterType('core')}
            className={`px-3 py-1 rounded-lg text-[11.5px] font-bold tracking-wider transition-all ${activeFilterType === 'core' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'text-stone-500 hover:opacity-100 opacity-70'}`}
          >
            核心主念头
          </button>
          <button
            onClick={() => setActiveFilterType('whisper')}
            className={`px-3 py-1 rounded-lg text-[11.5px] font-bold tracking-wider transition-all ${activeFilterType === 'whisper' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'text-stone-500 hover:opacity-100 opacity-70'}`}
          >
            碎碎念
          </button>
        </div>
      </div>

      {/* Main List Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 z-10 pb-20 select-none">
        
        {/* Welcome Info Box */}
        <div 
          className="rounded-[18px] p-4 border border-white/40 shadow-sm flex items-start gap-3 backdrop-blur-xl"
          style={{ backgroundColor: themeConfig.cardBg ? `${themeConfig.cardBg}BF` : 'rgba(255, 255, 255, 0.7)' }}
        >
          <Sparkles className="text-amber-500 shrink-0 mt-0.5 animate-pulse" size={17} />
          <div className="space-y-1">
            <h4 className="font-bold text-[13px]" style={{ color: themeConfig.textPrimary }}>💡 记忆档案馆说明</h4>
            <p className="text-[12px] leading-relaxed opacity-80" style={{ color: themeConfig.textSecondary }}>
              你在此处添加的自定义文案，不仅会实时与内置库合并供情绪系统“摇号”，还严格符合情绪系统的数值逻辑：只有当对应的属性数值超过 <strong>75</strong> 时，才允许抽取出对应的欲望或依恋文案！
            </p>
          </div>
        </div>

        {/* List of custom items */}
        {filteredThoughts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400">
            <BookOpen size={48} className="stroke-[1.2] opacity-40 mb-3" />
            <p className="text-[13px] font-medium">暂无匹配的定制记忆文案</p>
            {searchQuery || activeFilterCategory !== 'all' || activeFilterType !== 'all' ? (
              <button 
                onClick={() => { setSearchQuery(''); setActiveFilterCategory('all'); setActiveFilterType('all'); }} 
                className="mt-2 text-rose-500 text-[12px] font-semibold underline"
              >
                清空过滤条件
              </button>
            ) : (
              <button 
                onClick={handleOpenAdd} 
                className="mt-3 px-4 py-1.5 rounded-full bg-stone-800 text-white text-[12.5px] font-semibold shadow-md active:scale-95 transition-all"
              >
                点此添加第一条定制
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-[11.5px] font-semibold text-stone-500 mb-1 px-1">
              共有 {filteredThoughts.length} 篇定制记忆
            </div>
            {filteredThoughts.map((thought) => (
              <motion.div
                key={thought.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[20px] p-4.5 border border-black/[0.03] shadow-sm backdrop-blur-lg flex flex-col justify-between group transition-all"
                style={{ backgroundColor: themeConfig.cardBg || 'rgba(255, 255, 255, 0.85)' }}
              >
                {/* Meta details */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${CATEGORY_MAP[thought.category].color}`}>
                      {CATEGORY_MAP[thought.category].label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-bold border ${TYPE_MAP[thought.type].color}`}>
                      {TYPE_MAP[thought.type].label}
                    </span>
                  </div>
                  
                  {/* Actions buttons */}
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOpenEdit(thought)}
                      className="p-1.5 rounded-full hover:bg-black/5 text-stone-600 transition-colors"
                      title="编辑文案"
                    >
                      <Edit3 size={13} />
                    </button>
                    {deletingId === thought.id ? (
                      <div className="flex items-center gap-1 bg-white/90 border border-rose-200 shadow-sm rounded-lg p-0.5 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(thought.id);
                          }}
                          className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold active:scale-95 transition-all hover:bg-rose-700"
                        >
                          确定
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(null);
                          }}
                          className="px-2 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px] font-bold active:scale-95 transition-all hover:bg-stone-200"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setDeletingId(thought.id)}
                        className="p-1.5 rounded-full hover:bg-rose-50 text-rose-600 transition-colors"
                        title="删除文案"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Display Thought Text */}
                <div className="text-[14.5px] font-semibold leading-relaxed mb-3" style={{ color: themeConfig.textPrimary }}>
                  「{thought.text}」
                </div>

                {/* Core configuration extra info */}
                {thought.type === 'core' && (
                  <div className="border-t border-black/5 pt-2 mt-1 space-y-1.5 bg-black/[0.01] p-2 rounded-xl">
                    {thought.actionName && (
                      <div className="text-[12px] flex items-center gap-1.5 text-stone-600 leading-none">
                        <Heart size={11} className="text-rose-400 fill-current" />
                        <span className="font-bold shrink-0">互动动作:</span>
                        <span className="truncate opacity-80">{thought.actionName}</span>
                      </div>
                    )}
                    {thought.logText && (
                      <div className="text-[12px] flex items-start gap-1.5 text-stone-500 leading-normal">
                        <MessageSquareHeart size={11} className="text-indigo-400 shrink-0 mt-0.5" />
                        <span className="font-bold shrink-0">日志反馈:</span>
                        <span className="opacity-80 line-clamp-2 text-[11.5px]">{thought.logText}</span>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* Glassmorphic Form Dialog (Smooth fade slide overlay) */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            {/* Modal Box */}
            <motion.form 
              onSubmit={handleSubmit}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-[32px] sm:rounded-[28px] border border-white/50 shadow-2xl p-6 relative flex flex-col gap-4 select-none"
              style={{ 
                color: themeConfig.textPrimary || '#333',
                backgroundColor: 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(28px)'
              }}
            >
              <div className="flex justify-between items-center pb-2 border-b border-black/5">
                <span className="text-[16px] font-bold flex items-center gap-1.5">
                  <Sparkles size={16} className="text-amber-500" />
                  {editingThought ? '编辑定制记忆' : '登记新记忆 (添加定制)'}
                </span>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-transform active:scale-90"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Form Content */}
              <div className="space-y-4 text-stone-800">
                {/* 触发类别 select */}
                <div>
                  <label className="block text-[12px] font-bold text-stone-500 mb-1.5">1. 触发类别</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormType('core')}
                      className={`py-2 rounded-xl text-[12.5px] font-semibold border transition-all ${formType === 'core' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm' : 'bg-white/60 border-black/5 hover:bg-white text-stone-600'}`}
                    >
                      核心互动组在卡片展示
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormType('whisper')}
                      className={`py-2 rounded-xl text-[12.5px] font-semibold border transition-all ${formType === 'whisper' ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-sm' : 'bg-white/60 border-black/5 hover:bg-white text-stone-600'}`}
                    >
                      心底碎碎念列表展示
                    </button>
                  </div>
                </div>

                {/* 指标归属 select */}
                <div>
                  <label className="block text-[12px] font-bold text-stone-500 mb-1.5">2. 绑定情绪数值指标</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(CATEGORY_MAP) as Array<keyof typeof CATEGORY_MAP>).map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setFormCategory(key)}
                        className={`py-2 rounded-xl text-[12px] font-semibold border transition-all truncate flex flex-col items-center justify-center ${formCategory === key ? 'bg-stone-800 border-stone-800 text-white font-bold' : 'bg-white/60 border-black/5 text-stone-700'}`}
                      >
                        {CATEGORY_MAP[key].label}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1 pl-1 leading-normal">
                    * 如果归属是<strong>欲望</strong>或<strong>依恋</strong>，只有查岗数值大于 <strong>75</strong> 时才会被激发。否则进入日常常态。
                  </p>
                </div>

                {/* 展示文案 text */}
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-bold text-stone-500">3. 展示文案 (念头内文)</label>
                  <input
                    type="text"
                    required
                    placeholder="如：想要随时给未婚妻发亲吻表情包..."
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/5 bg-white/70 focus:bg-white focus:outline-none transition-all placeholder:text-stone-300 text-stone-900 font-medium"
                  />
                </div>

                {/* Optional core things */}
                {formType === 'core' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 pt-1"
                  >
                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-bold text-stone-500">
                        4. 互动按钮文字 <span className="text-[10px] font-normal opacity-70">(可选)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="默认为：听听Charlie的心声"
                        value={formActionName}
                        onChange={(e) => setFormActionName(e.target.value)}
                        className="w-full px-3.5 py-2 py-2.5 rounded-xl border border-black/5 bg-white/70 focus:bg-white focus:outline-none transition-all text-stone-800 text-[13px] font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-bold text-stone-500">
                        5. 心情记录/日志反馈内文 <span className="text-[10px] font-normal opacity-70">(可选，展示于 Timeline 记录)</span>
                      </label>
                      <textarea
                        placeholder="点击互动后会生成此条精美的日志沉浸式记录..."
                        rows={3}
                        value={formLogText}
                        onChange={(e) => setFormLogText(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-black/5 bg-white/70 focus:bg-white focus:outline-none transition-all text-stone-800 text-[13px] font-medium resize-none leading-relaxed"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Action Sheet buttons */}
              <div className="flex gap-2.5 pt-4 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl font-bold bg-black/5 hover:bg-black/10 active:scale-95 transition-all text-stone-600 text-[13.5px]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg shadow-emerald-700/10 active:scale-95 transition-all text-[13.5px] flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: '#10b981' }}
                >
                  <Check size={14} strokeWidth={2.5} />
                  保存并推送到馆
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
