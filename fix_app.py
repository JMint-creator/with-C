import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# The mess starts at <inp                {/* Beautification Widget */}
# and ends at </div>er gap-1.5 cursor-pointer group"

mess_regex = re.compile(r'<inp\s+\{\/\* Beautification Widget \*\/.*?\<\/div\>er gap-1\.5 cursor-pointer group"', re.DOTALL)

replacement = """<input 
                          type="date" 
                          value={anniversaryDate}
                          onChange={(e) => setAnniversaryDate(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div 
                          className="text-[11px] font-medium tracking-wider" 
                          style={{color: currentThemeConfig.textSecondary}}
                        >
                          {getFormattedDate(anniversaryDate)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  
                  {/* Right: Apps 2x2 Grid */}
                  <motion.div 
                    className="flex-1 grid grid-cols-2 gap-y-2 gap-x-2 content-start"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {page1Apps.map((app) => (
                      <div 
                        key={app.name} 
                        className="flex flex-col items-center justify-center gap-1.5 cursor-pointer group\""""

content = mess_regex.sub(replacement, content)

# Now let's fix the REAL Beautification Widget at the bottom of Page 1.
real_widget_regex = re.compile(r'\{\/\* Beautification Widget \*\/\}\s*\<motion\.div\s*className="w-full backdrop-blur-xl.*?自定义文本\s*\<\/div\>\s*\<\/motion\.div\>', re.DOTALL)

real_widget_replacement = """{/* Beautification Widget */}
                <motion.div 
                  className="flex w-full px-1 items-start gap-3 mt-4 shrink-0 relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="w-[44px] h-[44px] rounded-full overflow-hidden shrink-0 border-[2px] border-white shadow-sm cursor-pointer" onClick={() => avatar1InputRef.current?.click()}>
                    {avatar1 ? <img src={avatar1} className="w-full h-full object-cover" /> : <Cat size={22} className="m-auto mt-2 opacity-50" />}
                  </div>
                  <div className="bg-white/70 backdrop-blur-md px-4 py-2.5 rounded-[20px] rounded-tl-[4px] text-[13px] text-black/80 font-medium border border-white/50 shadow-[0_4px_16px_rgba(0,0,0,0.04)] mt-1.5 outline-none max-w-[75%] text-left relative before:content-[''] before:absolute before:top-0 before:-left-[5px] before:border-t-[6px] before:border-t-white/70 before:border-l-[6px] before:border-l-transparent" contentEditable suppressContentEditableWarning>
                    想和你一起去看海...
                  </div>
                </motion.div>"""

content = real_widget_regex.sub(real_widget_replacement, content)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done python fix")
