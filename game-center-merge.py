import re

with open('src/GameCenterView.tsx', 'r') as f:
    content = f.read()

target = """          {/* Game 1: 飞行棋 (常规) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl rounded-[20px] p-5 flex flex-col shadow-sm border border-black/[0.03]" style={{ backgroundColor: themeConfig.cardBg ? themeConfig.cardBg.replace(/0\.\d+\)/, `0.8)`) : 'rgba(255,255,255,0.8)' }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center bg-[#E8F0FE] text-[#1A73E8]">
                <Plane size={26} />
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-semibold text-inherit opacity-90">情侣飞行棋 <span className="text-[12px] font-normal text-inherit opacity-40 ml-1">常规版</span></div>
                <div className="text-[12px] text-inherit opacity-60 mt-0.5">专属两人的私密互动小游戏</div>
              </div>
            </div>
            
            <div className="bg-black/[0.03] rounded-[12px] p-3 mb-4 flex items-start gap-2 border border-transparent">
              <AlertCircle size={15} className="text-inherit opacity-40 mt-[1px] shrink-0" />
              <div className="text-[12px] text-inherit opacity-60 leading-relaxed">
                游戏内容暂未开放。您可以先消耗虚拟余额预购门票，敬请期待！
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <div className="text-[14px] font-medium" style={{ color: themeConfig.primaryColor }}>
                门票: ¥ 5.20 / 次
              </div>
              <button 
                onClick={() => handlePurchase('情侣飞行棋 (常规版)', 5.2)}
                className="px-5 py-2 rounded-full text-white text-[13px] font-medium active:opacity-80 transition-opacity"
                style={{ backgroundColor: themeConfig.primaryColor }}
              >
                购买门票
              </button>
            </div>
          </motion.div>

          {/* Game 2: 飞行棋 (午夜) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="backdrop-blur-xl rounded-[20px] p-5 flex flex-col shadow-sm border border-black/[0.03]" style={{ backgroundColor: themeConfig.cardBg ? themeConfig.cardBg.replace(/0\.\d+\)/, `0.8)`) : 'rgba(255,255,255,0.8)' }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center bg-[#FCE8E6] text-[#D93025]">
                <Plane size={26} />
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-semibold text-inherit opacity-90">情侣飞行棋 <span className="text-[12px] font-normal text-inherit opacity-40 ml-1">午夜版</span></div>
                <div className="text-[12px] text-inherit opacity-60 mt-0.5">进阶版互动，夜深人静时体验</div>
              </div>
            </div>
            
            <div className="bg-black/[0.03] rounded-[12px] p-3 mb-4 flex items-start gap-2 border border-transparent">
              <AlertCircle size={15} className="text-inherit opacity-40 mt-[1px] shrink-0" />
              <div className="text-[12px] text-inherit opacity-60 leading-relaxed">
                游戏内容暂未开放。您可以先消耗虚拟余额预购门票，敬请期待！
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <div className="text-[14px] font-medium" style={{ color: themeConfig.primaryColor }}>
                门票: ¥ 9.90 / 次
              </div>
              <button 
                onClick={() => handlePurchase('情侣飞行棋 (午夜版)', 9.9)}
                className="px-5 py-2 rounded-full text-white text-[13px] font-medium active:opacity-80 transition-opacity"
                style={{ backgroundColor: themeConfig.primaryColor }}
              >
                购买门票
              </button>
            </div>
          </motion.div>"""

replacement = """          {/* Game 1: 情侣飞行棋 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl rounded-[20px] p-5 flex flex-col shadow-sm border border-black/[0.03]" style={{ backgroundColor: themeConfig.cardBg ? themeConfig.cardBg.replace(/0\.\d+\)/, `0.8)`) : 'rgba(255,255,255,0.8)' }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center bg-[#E8F0FE] text-[#1A73E8]">
                <Plane size={26} />
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-semibold text-inherit opacity-90">情侣飞行棋</div>
                <div className="text-[12px] text-inherit opacity-60 mt-0.5">专属两人的私密互动小游戏</div>
              </div>
            </div>
            
            <div className="bg-black/[0.03] rounded-[12px] p-3 mb-4 flex items-start gap-2 border border-transparent">
              <AlertCircle size={15} className="text-inherit opacity-40 mt-[1px] shrink-0" />
              <div className="text-[12px] text-inherit opacity-60 leading-relaxed">
                游戏内容暂未开放。您可以先消耗虚拟余额预购门票，敬请期待！
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
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
            </div>
          </motion.div>"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/GameCenterView.tsx', 'w') as f:
        f.write(content)
    print("Replaced")
else:
    print("Not found")

