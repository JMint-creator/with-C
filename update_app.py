import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state
state_match = re.search(r"const \[motto, setMotto\] = useLocalState\('app_motto', '沉睡中缠绵 · 清醒又幻灭'\);", content)
if state_match:
    state_injection = """const [motto, setMotto] = useLocalState('app_motto', '沉睡中缠绵 · 清醒又幻灭');
  const [beautifyAvatar, setBeautifyAvatar] = useIDBState('app_beautify_avatar', '');
  const [beautifyText, setBeautifyText] = useLocalState('app_beautify_text', '想和你一起去看海...');"""
    content = content.replace(state_match.group(0), state_injection)
else:
    print("Could not find motto state")

# 2. Add ref
ref_match = re.search(r"const avatar1InputRef = useRef<HTMLInputElement>\(null\);", content)
if ref_match:
    ref_injection = """const avatar1InputRef = useRef<HTMLInputElement>(null);
  const beautifyAvatarInputRef = useRef<HTMLInputElement>(null);"""
    content = content.replace(ref_match.group(0), ref_injection)
else:
    print("Could not find avatar1InputRef")

# 3. Add hidden input
input_match = re.search(r'<input type="file" ref=\{avatar1InputRef\} className="hidden" accept="image/\*" onChange=\{\(e\) => handleFileChange\(e, setAvatar1\)\} />', content)
if input_match:
    input_injection = """<input type="file" ref={avatar1InputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setAvatar1)} />
        <input type="file" ref={beautifyAvatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, setBeautifyAvatar)} />"""
    content = content.replace(input_match.group(0), input_injection)
else:
    print("Could not find hidden input")

# 4. Add settings UI in component tab
settings_match = re.search(r'<SettingItem icon=\{MessageCircle\} label="顶部宣言" value=\{motto\} onChange=\{setMotto\} isTextarea=\{true\} />\s*<SettingItem icon=\{Type\} label="底部小字" value=\{subtitle\} onChange=\{setSubtitle\} hideBorder=\{true\} />\s*</div>\s*</div>', content, re.DOTALL)
if settings_match:
    settings_injection = """<SettingItem icon={MessageCircle} label="顶部宣言" value={motto} onChange={setMotto} isTextarea={true} />
                       <SettingItem icon={Type} label="底部小字" value={subtitle} onChange={setSubtitle} hideBorder={true} />
                    </div>
                 </div>
                 
                 <div>
                    <div className="text-[12px] font-medium text-[#8E8E93] mb-3 px-1 tracking-wide uppercase">第一页气泡组件</div>
                    <div className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#F2F2F7]">
                       <SettingItem icon={User} label="气泡头像" value={beautifyAvatar ? '已上传' : '未设置'} onClick={() => beautifyAvatarInputRef.current?.click()} />
                       <SettingItem icon={Type} label="气泡文案" value={beautifyText} onChange={setBeautifyText} hideBorder={true} isTextarea={true} />
                    </div>
                 </div>"""
    content = content.replace(settings_match.group(0), settings_injection)
else:
    print("Could not find settings UI insertion point")

# 5. Update the actual widget
# From:
# {/* Beautification Widget */}
# <motion.div 
# ...
# </motion.div>

widget_regex = re.compile(r'\{\/\* Beautification Widget \*\/\}\s*\<motion\.div.*?想和你一起去看海\.\.\.\s*\<\/div\>\s*\<\/motion\.div\>', re.DOTALL)
widget_replacement = """{/* Beautification Widget */}
                <motion.div 
                  className="flex w-full px-1 items-center gap-2.5 mt-4 shrink-0 relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="w-[38px] h-[38px] rounded-full overflow-hidden shrink-0 border-[1.5px] border-white shadow-sm cursor-pointer" onClick={() => beautifyAvatarInputRef.current?.click()}>
                    {beautifyAvatar ? <img src={beautifyAvatar} className="w-full h-full object-cover" /> : <Cat size={20} className="m-auto mt-2 opacity-50" />}
                  </div>
                  <div className="bg-white/60 backdrop-blur-md px-4 py-3 rounded-[20px] rounded-tl-[4px] text-[13.5px] text-black/80 font-medium shadow-[0_4px_16px_rgba(0,0,0,0.03)] outline-none max-w-[95%] text-left" style={{ wordBreak: 'break-word' }}>
                    {beautifyText}
                  </div>
                </motion.div>"""
content = widget_regex.sub(widget_replacement, content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
