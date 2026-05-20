import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, MessageCircle, RotateCcw, CheckSquare, EyeOff, Keyboard, Clock, Phone, Send, Smile, Volume2, Bell } from 'lucide-react';
import { useLocalState } from './utils';

export const ChatSettingsView = ({ onClose, themeConfig }: { onClose: () => void, themeConfig: any }) => {
  const [activeTab, setActiveTab] = useState('功能');

  const [quoteReply, setQuoteReply] = useLocalState('app_chatQuoteReply', true);
  const [readReceipt, setReadReceipt] = useLocalState('app_chatReadReceipt', true);
  const [receiptStyle, setReceiptStyle] = useLocalState<'graphic'|'text'>('app_chatReceiptStyle', 'graphic');
  const [readNoReply, setReadNoReply] = useLocalState('app_chatReadNoReply', false);
  const [typing, setTyping] = useLocalState('app_chatTyping', true);
  const [timestampStyle, setTimestampStyle] = useLocalState<'short'|'long'>('app_chatTimestampStyle', 'short');
  
  const [minWait, setMinWait] = useLocalState('app_chatMinWait', 10);
  const [maxWait, setMaxWait] = useLocalState('app_chatMaxWait', 50);
  const [proactive, setProactive] = useLocalState('app_chatProactive', false);
  const [proactiveInterval, setProactiveInterval] = useLocalState('app_chatProactiveInterval', 20);
  const [mixEmoji, setMixEmoji] = useLocalState('app_chatMixEmoji', true);
  const [mockVideo, setMockVideo] = useLocalState('app_chatMockVideoCall', true);
  
  const [keepAlive, setKeepAlive] = useLocalState('app_chatKeepAlive', false);
  const [pushNotify, setPushNotify] = useLocalState('app_chatPushNotify', true);

  const primaryColor = themeConfig.textPrimary || '#a894a7';
  const bgColor = themeConfig.bg || '#f9f9f9';

  return (
    <div className="flex-1 w-full bg-[#f9f9fa] flex flex-col font-sans overflow-y-auto relative h-full">
      <div className="bg-white/80 backdrop-blur-xl sticky top-0 z-20 pb-2">
        <div className="flex items-center pt-[env(safe-area-inset-top)] mt-6 px-6 mb-4">
          <div className="w-9 h-9 rounded-[14px] bg-[#f2eef2] flex items-center justify-center mr-3">
            <MessageCircle size={20} color={primaryColor} />
          </div>
          <span className="text-[20px] font-medium tracking-wide">聊天设置</span>
        </div>
        
        {/* Tabs */}
        <div className="flex px-6 space-x-6 border-b border-black/[0.04] overflow-x-auto scrollbar-hide">
          {['功能', '节奏', '音效', '显示', '昵称'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-[14px] font-medium transition-colors relative whitespace-nowrap ${activeTab === tab ? 'text-black' : 'text-[#8e8e93]'}`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="activeChatSettingsTab" className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-t-full bg-[#a894a7]" style={{ backgroundColor: primaryColor }} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 pb-24 space-y-8">
        {activeTab === '功能' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* 消息交互 */}
            <div>
              <div className="text-[13px] text-[#8e8e93] mb-3 ml-1 font-medium">消息交互</div>
              <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden border border-black/[0.02]">
                <div className="px-4 py-4 flex items-center justify-between border-b border-black/[0.03]">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-[#f2eef2] flex items-center justify-center text-[#a894a7]"><RotateCcw size={16} /></div>
                    <span className="text-[15px] text-[#333]">引用回复</span>
                  </div>
                  <Switch checked={quoteReply} onChange={setQuoteReply} color={primaryColor} />
                </div>
                <div className="px-4 py-4 flex items-center justify-between border-b border-black/[0.03]">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-[#f2eef2] flex items-center justify-center text-[#a894a7]"><CheckSquare size={16} /></div>
                    <span className="text-[15px] text-[#333]">已读回执</span>
                  </div>
                  <Switch checked={readReceipt} onChange={setReadReceipt} color={primaryColor} />
                </div>
                {readReceipt && (
                  <div className="px-4 py-3 bg-[#faf9fa] flex items-center justify-between border-b border-black/[0.03]">
                    <span className="text-[14px] text-[#8e8e93] ml-11">样式</span>
                    <div className="flex bg-[#f2f2f7] p-1 rounded-xl">
                      <button onClick={() => setReceiptStyle('graphic')} className={`px-4 py-1.5 rounded-[8px] text-[13px] font-medium transition-all ${receiptStyle === 'graphic' ? 'bg-[#a894a7] text-white shadow-sm' : 'text-[#8e8e93]'}`} style={receiptStyle === 'graphic' ? {backgroundColor: primaryColor} : {}}>图形</button>
                      <button onClick={() => setReceiptStyle('text')} className={`px-4 py-1.5 rounded-[8px] text-[13px] font-medium transition-all ${receiptStyle === 'text' ? 'bg-[#a894a7] text-white shadow-sm' : 'text-[#8e8e93]'}`} style={receiptStyle === 'text' ? {backgroundColor: primaryColor} : {}}>文字</button>
                    </div>
                  </div>
                )}
                <div className="px-4 py-4 flex items-center justify-between border-b border-black/[0.03]">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-[#f2eef2] flex items-center justify-center text-[#a894a7]"><EyeOff size={16} /></div>
                    <span className="text-[15px] text-[#333]">已读不回</span>
                  </div>
                  <Switch checked={readNoReply} onChange={setReadNoReply} color={primaryColor} />
                </div>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-[#f2eef2] flex items-center justify-center text-[#a894a7]"><Keyboard size={16} /></div>
                    <span className="text-[15px] text-[#333]">正在输入</span>
                  </div>
                  <Switch checked={typing} onChange={setTyping} color={primaryColor} />
                </div>
              </div>
            </div>

            {/* 时间戳 */}
            <div>
              <div className="text-[13px] text-[#8e8e93] mb-3 ml-1 font-medium">时间戳</div>
              <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-4 border border-black/[0.02] flex space-x-4">
                <button 
                  onClick={() => setTimestampStyle('short')}
                  className={`flex-1 py-4 rounded-[16px] border flex items-center justify-center space-x-2 transition-all ${timestampStyle === 'short' ? 'border-[#a894a7] bg-[#fcf9fc]' : 'border-black/[0.05] bg-[#fafafa]'}`}
                  style={timestampStyle === 'short' ? {borderColor: primaryColor, backgroundColor: primaryColor + '10'} : {}}
                >
                  <div className="w-6 h-6 rounded-full bg-[#f2eef2] flex items-center justify-center text-[#a894a7]"><Clock size={12} /></div>
                  <span className="text-[17px] font-serif text-[#333]">14:05</span>
                </button>
                <button 
                  onClick={() => setTimestampStyle('long')}
                  className={`flex-1 py-4 rounded-[16px] border flex items-center justify-center space-x-2 transition-all ${timestampStyle === 'long' ? 'border-[#a894a7] bg-[#fcf9fc]' : 'border-black/[0.05] bg-[#fafafa]'}`}
                  style={timestampStyle === 'long' ? {borderColor: primaryColor, backgroundColor: primaryColor + '10'} : {}}
                >
                  <div className="w-6 h-6 rounded-full bg-[#f2eef2] flex items-center justify-center text-[#a894a7]"><Clock size={12} /></div>
                  <span className="text-[17px] font-serif text-[#333]">14:05:30</span>
                </button>
              </div>
            </div>

            {/* 挂机保活音频 */}
            <div>
              <div className="text-[13px] text-[#8e8e93] mb-3 ml-1 font-medium">挂机保活音频</div>
              <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden border border-black/[0.02]">
                <div className="px-4 py-4 flex items-center justify-between border-b border-black/[0.03]">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-[#f2eef2] flex items-center justify-center text-[#a894a7] relative">
                      <Volume2 size={16} />
                      {keepAlive && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border-2 border-white rounded-full"></span>}
                    </div>
                    <div>
                      <div className="text-[15px] text-[#333]">后台保活</div>
                      <div className="text-[11px] text-[#8e8e93]">运行中·页面{keepAlive ? '已保活' : '未保活'}</div>
                    </div>
                  </div>
                  <Switch checked={keepAlive} onChange={setKeepAlive} color={primaryColor} />
                </div>
                {keepAlive && (
                  <div className="px-4 py-3 bg-[#faf9fa] flex items-center">
                    <span className="text-[13px] text-[#8e8e93] ml-11 mr-3">音频状态</span>
                    <div className="flex space-x-1 items-end h-3">
                      {[1,2,3,4,5].map(i => (
                        <motion.div 
                          key={i} 
                          className="w-1 bg-[#a894a7] rounded-full" 
                          style={{backgroundColor: primaryColor}}
                          animate={{ height: ['40%', '100%', '40%'] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                    <span className="text-[12px] font-medium text-[#a894a7] ml-2 tracking-widest" style={{color: primaryColor}}>LIVE</span>
                  </div>
                )}
              </div>
            </div>

            {/* 消息推送 */}
            <div>
              <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden border border-black/[0.02]">
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-orange-400 flex items-center justify-center text-white"><Bell size={20} /></div>
                    <div>
                      <div className="text-[16px] text-[#333] mb-0.5">后台消息推送</div>
                      <div className="text-[12px] text-[#8e8e93]">收到新消息时弹出提醒</div>
                    </div>
                  </div>
                  <Switch 
                    checked={pushNotify} 
                    onChange={(v) => {
                      if (v && 'Notification' in window && window.Notification.permission !== 'granted') {
                        window.Notification.requestPermission();
                      }
                      setPushNotify(v);
                    }} 
                    color={primaryColor} 
                  />
                </div>
              </div>
            </div>

          </motion.div>
        )}

        {activeTab === '节奏' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* 回复速度 */}
            <div>
              <div className="text-[13px] text-[#8e8e93] mb-3 ml-1 font-medium">回复速度</div>
              <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-5 border border-black/[0.02] space-y-6">
                <div className="flex items-center">
                  <div className="text-[15px] text-[#333] w-20">最短等待</div>
                  <input type="range" min="1" max="100" value={minWait} onChange={(e) => setMinWait(Number(e.target.value))} className="flex-1 mx-3" />
                  <div className="w-8 text-right text-[14px] text-[#a894a7]" style={{color: primaryColor}}>{minWait}s</div>
                </div>
                <div className="flex items-center">
                  <div className="text-[15px] text-[#333] w-20">最长等待</div>
                  <input type="range" min="1" max="100" value={maxWait} onChange={(e) => setMaxWait(Number(e.target.value))} className="flex-1 mx-3" />
                  <div className="w-8 text-right text-[14px] text-[#a894a7]" style={{color: primaryColor}}>{maxWait}s</div>
                </div>
              </div>
            </div>

            {/* 主动发送 */}
            <div>
              <div className="text-[13px] text-[#8e8e93] mb-3 ml-1 font-medium">主动发送</div>
              <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden border border-black/[0.02]">
                <div className="px-5 py-4 flex items-center justify-between border-b border-black/[0.03]">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-[#f2eef2] flex items-center justify-center text-[#a894a7]"><Send size={15} className="-ml-0.5" /></div>
                    <span className="text-[15px] text-[#333]">主动发消息给我</span>
                  </div>
                  <Switch checked={proactive} onChange={setProactive} color={primaryColor} />
                </div>
                {proactive && (
                  <div className="px-5 py-5 flex items-center bg-[#faf9fa]">
                    <div className="text-[15px] text-[#333] w-12 text-[#8e8e93]">间隔</div>
                    <input type="range" min="1" max="60" value={proactiveInterval} onChange={(e) => setProactiveInterval(Number(e.target.value))} className="flex-1 mx-4" />
                    <div className="w-12 text-right text-[14px] text-[#a894a7]" style={{color: primaryColor}}>{proactiveInterval}分钟</div>
                  </div>
                )}
              </div>
            </div>

            {/* 消息节奏 */}
            <div>
              <div className="text-[13px] text-[#8e8e93] mb-3 ml-1 font-medium">消息节奏</div>
              <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-4 border border-black/[0.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-[#f2eef2] flex items-center justify-center text-[#a894a7] shrink-0"><Smile size={16} /></div>
                    <div>
                      <div className="text-[15px] text-[#333]">表情混入消息</div>
                      <div className="text-[11px] text-[#8e8e93] mt-0.5">开启后表情与文字同条发送</div>
                    </div>
                  </div>
                  <Switch checked={mixEmoji} onChange={setMixEmoji} color={primaryColor} />
                </div>
              </div>
            </div>

            {/* 通话功能 */}
            <div>
              <div className="text-[13px] text-[#8e8e93] mb-3 ml-1 font-medium">通话功能</div>
              <div className="bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-4 border border-black/[0.02]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 pr-2">
                    <div className="w-8 h-8 rounded-xl bg-[#f2eef2] flex items-center justify-center text-[#a894a7] shrink-0"><Phone size={16} /></div>
                    <div>
                      <div className="text-[15px] text-[#333]">模拟视频通话</div>
                      <div className="text-[11px] text-[#8e8e93] mt-0.5 leading-snug">关闭后隐藏主界面通话按键</div>
                    </div>
                  </div>
                  <Switch checked={mockVideo} onChange={setMockVideo} color={primaryColor} />
                </div>
              </div>
            </div>

          </motion.div>
        )}

      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#f9f9fa] border-t border-black/5 p-4 flex justify-between z-30 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <button onClick={onClose} className="px-6 py-3 bg-white text-[#333] font-medium rounded-2xl shadow-sm border border-black/[0.03] active:bg-gray-50 flex items-center">
          <ChevronLeft size={18} className="-ml-1 mr-1" /> 返回
        </button>
        <button onClick={onClose} className="px-8 py-3 bg-[#f2f2f7] text-[#333] font-medium rounded-2xl active:bg-[#e5e5ea]">
          关闭
        </button>
      </div>
    </div>
  );
}

function Switch({ checked, onChange, color }: { checked: boolean, onChange: (v: boolean) => void, color: string }) {
  return (
    <button 
      className={`w-12 h-[28px] rounded-full p-0.5 transition-colors duration-300 ${checked ? 'bg-[#a894a7]' : 'bg-[#e5e5ea]'}`}
      style={checked ? {backgroundColor: color} : {}}
      onClick={() => onChange(!checked)}
    >
      <motion.div 
        className="w-[24px] h-[24px] bg-white rounded-full shadow-sm"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
