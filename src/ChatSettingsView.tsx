import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, MessageCircle, RotateCcw, CheckSquare, EyeOff, Keyboard, Clock, Phone, Send, Smile, Volume2, Bell, MessageSquare, Hand } from 'lucide-react';
import { useLocalState } from './utils';

export const ChatSettingsView = ({ onClose, themeConfig }: { onClose: () => void, themeConfig: any }) => {
  const [activeTab, setActiveTab] = useState('功能');

  const [quoteReply, setQuoteReply] = useLocalState('app_chatQuoteReply', true);
  const [readReceipt, setReadReceipt] = useLocalState('app_chatReadReceipt', true);
  const [receiptStyle, setReceiptStyle] = useLocalState<'graphic'|'text'>('app_chatReceiptStyle', 'graphic');
  const [readNoReply, setReadNoReply] = useLocalState('app_chatReadNoReply', false);
  const [typing, setTyping] = useLocalState('app_chatTyping', true);
  const [nudgeText, setNudgeText] = useLocalState('app_chatNudgeText', '拍了拍对方');
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

  return (
    <div className="flex-1 w-full bg-[#F2F2F7] min-h-[100dvh] relative text-[11px]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* Header */}
      <div 
        className="w-full flex items-center justify-between px-3 pb-3 bg-[#F2F2F7] fixed top-0 left-0 right-0 z-50 shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
      >
        <button onClick={onClose} className="text-[14px] flex items-center active:opacity-50 transition-opacity" style={{ color: primaryColor }}>
          <ChevronLeft size={24} className="-ml-1.5" />返回
        </button>
        <span className="text-[14px] font-semibold text-black">聊天设置</span>
        <div className="w-[60px]"></div>
      </div>
      
      {/* Categories Tabs */}
      <div 
        className="w-full flex px-4 space-x-6 bg-[#F2F2F7]/95 backdrop-blur-md fixed left-0 right-0 z-40 border-b border-[#c6c6c8]/30 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-2 pb-0"
        style={{ top: 'calc(3rem + env(safe-area-inset-top))' }}
      >
        {['功能', '节奏'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-[13px] font-medium transition-colors relative whitespace-nowrap ${activeTab === tab ? 'text-black' : 'text-[#8e8e93]'}`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div layoutId="activeChatSettingsTab" className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-t-full" style={{ backgroundColor: primaryColor }} />
            )}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md mx-auto px-4 pb-12 pt-[calc(6rem+env(safe-area-inset-top))]">
        {activeTab === '功能' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* 消息交互 */}
            <div>
              <div className="text-[12px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">消息交互</div>
              <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <div className="px-4 py-3 flex items-center justify-between border-b border-[#E5E5EA]">
                  <div className="flex items-center space-x-3">
                    <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}><RotateCcw size={16} /></div>
                    <span className="text-[14px] text-[#333]">引用回复</span>
                  </div>
                  <Switch checked={quoteReply} onChange={setQuoteReply} color={primaryColor} />
                </div>
                <div className="px-4 py-3 flex items-center justify-between border-b border-[#E5E5EA]">
                  <div className="flex items-center space-x-3">
                    <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}><CheckSquare size={16} /></div>
                    <span className="text-[14px] text-[#333]">已读回执</span>
                  </div>
                  <Switch checked={readReceipt} onChange={setReadReceipt} color={primaryColor} />
                </div>
                {readReceipt && (
                  <div className="px-4 py-2 bg-[#faf9fa] flex items-center justify-between border-b border-[#E5E5EA]">
                    <span className="text-[13px] text-[#8e8e93] ml-[42px]">样式</span>
                    <div className="flex bg-[#f2f2f7] p-0.5 rounded-[8px]">
                      <button onClick={() => setReceiptStyle('graphic')} className={`px-3 py-1 rounded-[6px] text-[12px] font-medium transition-all ${receiptStyle === 'graphic' ? 'bg-white shadow-sm text-black' : 'text-[#8e8e93]'}`}>图形</button>
                      <button onClick={() => setReceiptStyle('text')} className={`px-3 py-1 rounded-[6px] text-[12px] font-medium transition-all ${receiptStyle === 'text' ? 'bg-white shadow-sm text-black' : 'text-[#8e8e93]'}`}>文字</button>
                    </div>
                  </div>
                )}
                <div className="px-4 py-3 flex items-center justify-between border-b border-[#E5E5EA]">
                  <div className="flex items-center space-x-3">
                    <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}><EyeOff size={16} /></div>
                    <span className="text-[14px] text-[#333]">已读不回</span>
                  </div>
                  <Switch checked={readNoReply} onChange={setReadNoReply} color={primaryColor} />
                </div>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}><Keyboard size={16} /></div>
                    <span className="text-[14px] text-[#333]">正在输入</span>
                  </div>
                  <Switch checked={typing} onChange={setTyping} color={primaryColor} />
                </div>
                <div className="px-4 py-3 flex items-center justify-between border-t border-[#E5E5EA]">
                  <div className="flex items-center space-x-3 w-full">
                    <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}><Hand size={16} /></div>
                    <div className="flex-1">
                      <div className="text-[14px] text-[#333]">拍一拍文案</div>
                      <input 
                        type="text" 
                        value={nudgeText} 
                        onChange={(e) => setNudgeText(e.target.value)}
                        placeholder="拍了拍对方"
                        className="text-[12px] text-[#8e8e93] w-full bg-transparent outline-none mt-0.5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 时间戳 */}
            <div>
              <div className="text-[12px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">时间戳</div>
              <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-3 flex space-x-3">
                <button 
                  onClick={() => setTimestampStyle('short')}
                  className={`flex-1 py-3 rounded-[8px] border flex items-center justify-center space-x-2 transition-all`}
                  style={timestampStyle === 'short' ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` } : { borderColor: '#E5E5EA', backgroundColor: '#fafafa' }}
                >
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm" style={{ color: primaryColor }}><Clock size={11} /></div>
                  <span className="text-[14px] font-serif text-[#333]">14:05</span>
                </button>
                <button 
                  onClick={() => setTimestampStyle('long')}
                  className={`flex-1 py-3 rounded-[8px] border flex items-center justify-center space-x-2 transition-all`}
                  style={timestampStyle === 'long' ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` } : { borderColor: '#E5E5EA', backgroundColor: '#fafafa' }}
                >
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm" style={{ color: primaryColor }}><Clock size={11} /></div>
                  <span className="text-[14px] font-serif text-[#333]">14:05:30</span>
                </button>
              </div>
            </div>

            {/* 挂机保活 */}
            <div>
              <div className="text-[12px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">后台保活</div>
              <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <div className="px-4 py-3 flex items-center justify-between border-b border-[#E5E5EA]">
                  <div className="flex items-center space-x-3">
                    <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center relative" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>
                      <Volume2 size={16} />
                      {keepAlive && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-[1.5px] border-white rounded-full" style={{ backgroundColor: primaryColor }}></span>}
                    </div>
                    <div>
                      <div className="text-[14px] text-[#333]">挂机保活音频</div>
                      <div className="text-[11px] text-[#8e8e93]">页面{keepAlive ? '已保活' : '未保活'}</div>
                    </div>
                  </div>
                  <Switch checked={keepAlive} onChange={setKeepAlive} color={primaryColor} />
                </div>
                {keepAlive && (
                  <div className="px-4 py-2 bg-[#faf9fa] flex items-center">
                    <span className="text-[12px] text-[#8e8e93] ml-[42px] mr-3">音频状态</span>
                    <div className="flex space-x-1 items-end h-[10px]">
                      {[1,2,3,4,5].map(i => (
                        <motion.div 
                          key={i} 
                          className="w-1 rounded-full" 
                          style={{ backgroundColor: primaryColor }}
                          animate={{ height: ['40%', '100%', '40%'] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-medium ml-2 tracking-widest" style={{ color: primaryColor }}>LIVE</span>
                  </div>
                )}
              </div>
            </div>

            {/* 消息推送 */}
            <div>
              <div className="text-[12px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">系统通知</div>
              <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}><Bell size={16} /></div>
                    <div>
                      <div className="text-[14px] text-[#333]">后台消息推送</div>
                      <div className="text-[11px] text-[#8e8e93]">收到新消息时弹出系统提醒</div>
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* 回复速度 */}
            <div>
              <div className="text-[12px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">回复速度</div>
              <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-4 space-y-5">
                <div className="flex items-center">
                  <div className="text-[13px] text-[#333] w-16">最短等待</div>
                  <input type="range" min="1" max="100" value={minWait} onChange={(e) => setMinWait(Number(e.target.value))} className="flex-1 mx-3" />
                  <div className="w-8 text-right text-[12px]" style={{ color: primaryColor }}>{minWait}s</div>
                </div>
                <div className="flex items-center">
                  <div className="text-[13px] text-[#333] w-16">最长等待</div>
                  <input type="range" min="1" max="100" value={maxWait} onChange={(e) => setMaxWait(Number(e.target.value))} className="flex-1 mx-3" />
                  <div className="w-8 text-right text-[12px]" style={{ color: primaryColor }}>{maxWait}s</div>
                </div>
              </div>
            </div>

            {/* 主动发送 */}
            <div>
              <div className="text-[12px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">主动联系</div>
              <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <div className="px-4 py-3 flex items-center justify-between border-b border-[#E5E5EA]">
                  <div className="flex items-center space-x-3">
                    <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}><Send size={15} className="-ml-0.5" /></div>
                    <span className="text-[14px] text-[#333]">主动发消息给我</span>
                  </div>
                  <Switch checked={proactive} onChange={setProactive} color={primaryColor} />
                </div>
                {proactive && (
                  <div className="px-4 py-3 flex items-center bg-[#faf9fa]">
                    <div className="text-[13px] text-[#8e8e93] w-12 ml-[42px]">间隔</div>
                    <input type="range" min="1" max="60" value={proactiveInterval} onChange={(e) => setProactiveInterval(Number(e.target.value))} className="flex-1 mx-3" />
                    <div className="w-12 text-right text-[12px]" style={{ color: primaryColor }}>{proactiveInterval}m</div>
                  </div>
                )}
              </div>
            </div>

            {/* 消息节奏 */}
            <div>
              <div className="text-[12px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">消息节奏</div>
              <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}><Smile size={16} /></div>
                    <div>
                      <div className="text-[14px] text-[#333]">表情混入消息</div>
                      <div className="text-[11px] text-[#8e8e93]">开启后表情与文字同条发送</div>
                    </div>
                  </div>
                  <Switch checked={mixEmoji} onChange={setMixEmoji} color={primaryColor} />
                </div>
              </div>
            </div>

            {/* 通话功能 */}
            <div>
              <div className="text-[12px] text-[#6d6d72] ml-4 mb-2 uppercase tracking-wide">通话功能</div>
              <div className="bg-white rounded-[10px] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3 pr-2">
                    <div className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}><Phone size={16} /></div>
                    <div>
                      <div className="text-[14px] text-[#333]">模拟视频通话</div>
                      <div className="text-[11px] text-[#8e8e93] leading-snug">关闭后隐藏主界面通话按键</div>
                    </div>
                  </div>
                  <Switch checked={mockVideo} onChange={setMockVideo} color={primaryColor} />
                </div>
              </div>
            </div>

          </motion.div>
        )}

      </div>
    </div>
  );
}

function Switch({ checked, onChange, color }: { checked: boolean, onChange: (v: boolean) => void, color: string }) {
  return (
    <button 
      className={`relative w-[48px] h-[28px] rounded-full p-0.5 transition-colors duration-300 ${!checked ? 'bg-[#e5e5ea]' : ''}`}
      style={checked ? { backgroundColor: color } : {}}
      onClick={() => onChange(!checked)}
    >
      <motion.div 
        className="w-[24px] h-[24px] bg-white rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

