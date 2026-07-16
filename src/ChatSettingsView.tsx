import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, MessageCircle, RotateCcw, CheckSquare, EyeOff, Keyboard, Clock, Phone, Send, Smile, Volume2, Bell, MessageSquare, Hand } from 'lucide-react';
import { useLocalState, useIDBState } from './utils';

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
  const [keepaliveAudio, setKeepaliveAudio] = useIDBState('app_keepalive_audio', '');
  const [pushNotify, setPushNotify] = useLocalState('app_chatPushNotify', true);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target && event.target.result) {
                  const val = event.target.result as string;
                  setKeepaliveAudio(val);
                  window.dispatchEvent(new CustomEvent('keepalive_audio_changed', { detail: val }));
              }
          };
          reader.readAsDataURL(file);
      }
  };

  const primaryColor = themeConfig.textPrimary || '#a894a7';

  return (
    <div className="absolute inset-0 bg-[#FAFAFA] flex flex-col overflow-x-hidden overflow-y-auto text-[13px]">
      
      {/* Header */}
      <div 
        className="w-full flex items-center justify-between px-4 pb-3 bg-[#FAFAFA]/80 sticky top-0 z-30 border-b border-[#E5E5EA] backdrop-blur-md"
        style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
      >
        <button onClick={onClose} className="text-[#333] flex items-center active:opacity-50 transition-opacity w-[60px]">
          <ChevronLeft size={24} className="-ml-1.5" />
        </button>
        <span className="text-[16px] font-semibold tracking-tight text-[#111]">聊天与机制设置</span>
        <div className="w-[60px]"></div>
      </div>
      
      {/* Categories Tabs */}
      <div 
        className="w-full bg-[#FAFAFA]/90 sticky top-[53px] z-20 border-b border-[#F2F2F7] backdrop-blur-md"
      >
        <div className="w-full max-w-2xl mx-auto flex px-4 space-x-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pt-2 pb-0">
          {['功能', '节奏'].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-[13.5px] font-semibold transition-colors relative whitespace-nowrap ${activeTab === tab ? 'text-black' : 'text-[#8e8e93]'}`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="activeChatSettingsTab" className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-t-full" style={{ backgroundColor: primaryColor }} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-2xl mx-auto px-4 pb-20 pt-6 space-y-8">
        {activeTab === '功能' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* 消息交互 */}
            <div>
              <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">消息交互</div>
              <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                <div className="px-5 py-4.5 flex items-center justify-between border-b border-[#F2F2F7]">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0 animate-pulse-subtle" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}><RotateCcw size={18} /></div>
                    <div>
                      <span className="text-[15px] font-medium text-[#333]">引用回复</span>
                      <div className="text-[12px] text-[#8e8e93] mt-0.5">当双击信息或特定节点时引用上一条内容</div>
                    </div>
                  </div>
                  <Switch checked={quoteReply} onChange={setQuoteReply} color={primaryColor} />
                </div>
                
                <div className="px-5 py-4.5 flex items-center justify-between border-b border-[#F2F2F7]">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}><CheckSquare size={18} /></div>
                    <div>
                      <span className="text-[15px] font-medium text-[#333]">已读回执</span>
                      <div className="text-[12px] text-[#8e8e93] mt-0.5">消息展示对方已读的状态状态</div>
                    </div>
                  </div>
                  <Switch checked={readReceipt} onChange={setReadReceipt} color={primaryColor} />
                </div>
                
                {readReceipt && (
                  <div className="px-5 py-4 bg-[#FAFAFA] flex items-center justify-between border-b border-[#F2F2F7]">
                    <span className="text-[13px] text-[#8e8e93] ml-[50px] font-medium">回执样式</span>
                    <div className="flex bg-[#E5E5EA]/60 p-0.5 rounded-[8px]">
                      <button onClick={() => setReceiptStyle('graphic')} className={`px-4 py-1 rounded-[6px] text-[12px] font-semibold transition-all ${receiptStyle === 'graphic' ? 'bg-white shadow-sm text-black' : 'text-[#8e8e93]'}`}>图形</button>
                      <button onClick={() => setReceiptStyle('text')} className={`px-4 py-1 rounded-[6px] text-[12px] font-semibold transition-all ${receiptStyle === 'text' ? 'bg-white shadow-sm text-black' : 'text-[#8e8e93]'}`}>文字</button>
                    </div>
                  </div>
                )}
                
                <div className="px-5 py-4.5 flex items-center justify-between border-b border-[#F2F2F7]">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}><EyeOff size={18} /></div>
                    <div>
                      <span className="text-[15px] font-medium text-[#333]">已读不回</span>
                      <div className="text-[12px] text-[#8e8e93] mt-0.5">偶尔在阅读后故意不立即做出回复</div>
                    </div>
                  </div>
                  <Switch checked={readNoReply} onChange={setReadNoReply} color={primaryColor} />
                </div>
                
                <div className="px-5 py-4.5 flex items-center justify-between border-b border-[#F2F2F7]">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}><Keyboard size={18} /></div>
                    <div>
                      <span className="text-[15px] font-medium text-[#333]">正在输入</span>
                      <div className="text-[12px] text-[#8e8e93] mt-0.5">对方打字时展示“正在输入中...”气泡</div>
                    </div>
                  </div>
                  <Switch checked={typing} onChange={setTyping} color={primaryColor} />
                </div>
                
                <div className="px-5 py-4.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5 w-full">
                    <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}><Hand size={18} /></div>
                    <div className="flex-1">
                      <div className="text-[15px] font-medium text-[#333]">拍一拍文案</div>
                      <input 
                        type="text" 
                        value={nudgeText} 
                        onChange={(e) => setNudgeText(e.target.value)}
                        placeholder="拍了拍对方"
                        className="text-[13px] text-[#8e8e93] w-full bg-transparent outline-none mt-1 border-b border-transparent focus:border-[#F2F2F7] pb-0.5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 时间戳 */}
            <div>
              <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">时间戳</div>
              <div className="bg-white rounded-[20px] p-4.5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7] flex space-x-3">
                <button 
                  onClick={() => setTimestampStyle('short')}
                  className={`flex-1 py-3.5 rounded-[12px] border flex items-center justify-center space-x-2 transition-all`}
                  style={timestampStyle === 'short' ? { borderColor: primaryColor, backgroundColor: `${primaryColor}08` } : { borderColor: '#F2F2F7', backgroundColor: '#FAFAFA' }}
                >
                  <div className="w-5.5 h-5.5 rounded-full bg-white flex items-center justify-center shadow-sm" style={{ color: primaryColor }}><Clock size={12} /></div>
                  <span className="text-[14px] font-serif font-medium text-[#333]">14:05</span>
                </button>
                <button 
                  onClick={() => setTimestampStyle('long')}
                  className={`flex-1 py-3.5 rounded-[12px] border flex items-center justify-center space-x-2 transition-all`}
                  style={timestampStyle === 'long' ? { borderColor: primaryColor, backgroundColor: `${primaryColor}08` } : { borderColor: '#F2F2F7', backgroundColor: '#FAFAFA' }}
                >
                  <div className="w-5.5 h-5.5 rounded-full bg-white flex items-center justify-center shadow-sm" style={{ color: primaryColor }}><Clock size={12} /></div>
                  <span className="text-[14px] font-serif font-medium text-[#333]">14:05:30</span>
                </button>
              </div>
            </div>

            {/* 挂机保活 */}
            <div>
              <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">后台保活</div>
              <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                <div className="px-5 py-4.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center relative shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
                      <Volume2 size={18} />
                      {keepAlive && <span className="absolute bottom-0 right-0 w-3 h-3 border-[2px] border-white rounded-full bg-[#34C759]"></span>}
                    </div>
                    <div>
                      <div className="text-[15px] font-medium text-[#333]">保持后台运行活跃</div>
                      <div className="text-[12px] text-[#8e8e93] mt-0.5">页面{keepAlive ? '已开启保活通道' : '未保活'}</div>
                    </div>
                  </div>
                  <Switch checked={keepAlive} onChange={setKeepAlive} color={primaryColor} />
                </div>
                {keepAlive && (
                  <div className="px-5 py-3.5 bg-[#FAFAFA] flex items-center justify-between border-t border-[#F2F2F7]">
                    <div className="flex items-center">
                      <span className="text-[12.5px] text-[#666] ml-[50px] mr-3">保活音频: {keepaliveAudio ? '🎉 自定义' : '🔇 静音'}</span>
                      <div className="flex space-x-1 items-end h-[12px]">
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
                      <span className="text-[10px] font-bold ml-2.5 tracking-wider bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded" style={{ color: primaryColor }}>LIVE</span>
                    </div>
                    <div>
                      <input type="file" id="keepaliveAudioUpload" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                      <label htmlFor="keepaliveAudioUpload" className="text-[12.5px] font-semibold text-[#007AFF] cursor-pointer hover:opacity-85">更换音频</label>
                    </div>
                  </div>
                )}
                {keepAlive && !keepaliveAudio && (
                  <div className="px-5 py-3 bg-[#FAFAFA] border-t border-[#F2F2F7]">
                    <div className="text-[#8e8e93] text-[11.5px] ml-[50px] leading-relaxed">
                      若默认静音在部分浏览器中失效，自定一段你喜欢的循环背景声可以有效持久驻留后台。
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 消息推送 */}
            <div>
              <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">系统通知</div>
              <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                <div className="px-5 py-4.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}><Bell size={18} /></div>
                    <div>
                      <div className="text-[15px] font-medium text-[#333]">强力后台推送消息</div>
                      <div className="text-[12px] text-[#8e8e93] mt-0.5">当切到后台或锁屏时实时弹窗通知</div>
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
              <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">回复速度</div>
              <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7] space-y-6">
                <div>
                  <div className="flex justify-between text-[14px] text-[#333] mb-3">
                    <span className="font-semibold">最短等待时间</span>
                    <span className="font-mono font-bold text-[14px]" style={{ color: primaryColor }}>{minWait}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={minWait} 
                    onChange={(e) => setMinWait(Number(e.target.value))} 
                    className="w-full h-1.5 bg-[#e5e5ea] rounded-lg appearance-none cursor-pointer" 
                    style={{
                      background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} ${minWait}%, #e5e5ea ${minWait}%, #e5e5ea 100%)`
                    }}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[14px] text-[#333] mb-3">
                    <span className="font-semibold">最长等待时间</span>
                    <span className="font-mono font-bold text-[14px]" style={{ color: primaryColor }}>{maxWait}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={maxWait} 
                    onChange={(e) => setMaxWait(Number(e.target.value))} 
                    className="w-full h-1.5 bg-[#e5e5ea] rounded-lg appearance-none cursor-pointer" 
                    style={{
                      background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} ${maxWait}%, #e5e5ea ${maxWait}%, #e5e5ea 100%)`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 主动发送 */}
            <div>
              <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">主动联系</div>
              <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                <div className="px-5 py-4.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}><Send size={16} className="-ml-0.5" /></div>
                    <div>
                      <div className="text-[15px] font-medium text-[#333]">主动发起谈话</div>
                      <div className="text-[12px] text-[#8e8e93] mt-0.5">梦角在闲暇时间会偶尔主动打招呼</div>
                    </div>
                  </div>
                  <Switch checked={proactive} onChange={setProactive} color={primaryColor} />
                </div>
                {proactive && (
                  <div className="px-5 py-4 bg-[#FAFAFA] border-t border-[#F2F2F7]">
                    <div className="flex justify-between text-[14px] text-[#333] mb-3">
                      <span className="font-semibold ml-[50px]">主动谈话频率</span>
                      <span className="font-mono font-bold text-[14px]" style={{ color: primaryColor }}>每 {proactiveInterval} 分钟</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="60" 
                      value={proactiveInterval} 
                      onChange={(e) => setProactiveInterval(Number(e.target.value))} 
                      className="w-full h-1.5 bg-[#e5e5ea] rounded-lg appearance-none cursor-pointer ml-0 sm:ml-[50px] sm:w-[calc(100%-50px)]" 
                      style={{
                        background: `linear-gradient(to right, ${primaryColor} 0%, ${primaryColor} ${proactiveInterval / 0.6}%, #e5e5ea ${proactiveInterval / 0.6}%, #e5e5ea 100%)`
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 消息节奏 */}
            <div>
              <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">消息节奏</div>
              <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                <div className="px-5 py-4.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}><Smile size={18} /></div>
                    <div>
                      <div className="text-[15px] font-medium text-[#333]">表情跟同单条消息混入</div>
                      <div className="text-[12px] text-[#8e8e93] mt-0.5">梦角打字时会将自定或内置表情包穿插文内</div>
                    </div>
                  </div>
                  <Switch checked={mixEmoji} onChange={setMixEmoji} color={primaryColor} />
                </div>
              </div>
            </div>

            {/* 通话功能 */}
            <div>
              <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">通话功能</div>
              <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                <div className="px-5 py-4.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5 pr-2">
                    <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}><Phone size={18} /></div>
                    <div>
                      <div className="text-[15px] font-medium text-[#333]">可模拟拨打视频与语音</div>
                      <div className="text-[12px] text-[#8e8e93] mt-0.5 leading-snug">关闭后主页通话功能按钮、语音功能入口将自动隐藏</div>
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

