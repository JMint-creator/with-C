with open('src/GameCenterView.tsx', 'r') as f:
    content = f.read()

target = """            <div className="flex flex-col gap-3 mt-auto">
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-medium text-inherit opacity-80">
                  常规版 <span className="text-[12px] font-normal text-inherit opacity-60 ml-1">¥ 520 / 次</span>
                </div>
                <button 
                  onClick={() => handlePurchase('情侣飞行棋 (常规版)', 520)}
                  className="px-4 py-1.5 rounded-full text-white text-[13px] font-medium active:opacity-80 transition-opacity"
                  style={{ backgroundColor: themeConfig.primaryColor }}
                >
                  购买门票
                </button>
              </div>
              <div className="h-[1px] w-full bg-black/[0.05]"></div>
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-medium text-inherit opacity-80 flex flex-col">
                  <span>午夜版 <span className="text-[10px] bg-[#FCE8E6] text-[#D93025] px-1.5 py-0.5 rounded-md ml-1 font-normal">进阶互动</span></span>
                  <span className="text-[12px] font-normal text-inherit opacity-60 mt-0.5">¥ 999 / 次</span>
                </div>
                <button 
                  onClick={() => handlePurchase('情侣飞行棋 (午夜版)', 999)}
                  className="px-4 py-1.5 rounded-full text-white text-[13px] font-medium active:opacity-80 transition-opacity"
                  style={{ backgroundColor: themeConfig.primaryColor }}
                >
                  购买门票
                </button>
              </div>
            </div>"""

replacement = """            <div className="flex flex-col gap-3 mt-auto">
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-medium text-inherit opacity-80">
                  常规版 <span className="text-[12px] font-normal text-inherit opacity-60 ml-1">¥ 520 / 次</span>
                </div>
                <button 
                  onClick={() => handlePurchase('情侣飞行棋 (常规版)', 520)}
                  className="px-4 py-1.5 rounded-full text-[#333] text-[13px] font-medium active:opacity-80 transition-opacity"
                  style={{ backgroundColor: themeConfig.primaryColor }}
                >
                  购买门票
                </button>
              </div>
              <div className="h-[1px] w-full bg-black/[0.05]"></div>
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-medium text-inherit opacity-80">
                  午夜版 <span className="text-[12px] font-normal text-inherit opacity-60 ml-1">¥ 999 / 次</span>
                </div>
                <button 
                  onClick={() => handlePurchase('情侣飞行棋 (午夜版)', 999)}
                  className="px-4 py-1.5 rounded-full text-[#333] text-[13px] font-medium active:opacity-80 transition-opacity"
                  style={{ backgroundColor: themeConfig.primaryColor }}
                >
                  购买门票
                </button>
              </div>
            </div>"""

if target in content:
    content = content.replace(target, replacement)
    
content = content.replace('className="px-5 py-2 rounded-full text-white text-[13px] font-medium active:opacity-80 transition-opacity"', 'className="px-5 py-2 rounded-full text-[#333] text-[13px] font-medium active:opacity-80 transition-opacity"')

with open('src/GameCenterView.tsx', 'w') as f:
    f.write(content)

