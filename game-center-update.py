with open('src/GameCenterView.tsx', 'r') as f:
    content = f.read()

target_header = """      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-4 bg-white/80 backdrop-blur-md">
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/5 active:bg-black/10 transition-colors"
        >
          <ChevronLeft size={24} style={{ color: themeConfig.primaryColor }} />
        </button>
        <div className="text-[17px] font-semibold" style={{ color: themeConfig.textPrimary }}>
          游戏中心
        </div>
        <div className="w-10 h-10 flex items-center justify-center">
          <Gamepad2 size={24} style={{ color: themeConfig.primaryColor }} />
        </div>
      </div>"""

replacement_header = """      {/* Header */}
      <div className="w-full flex items-center justify-between px-4 pb-2 sticky top-0 z-10 pt-[max(1rem,env(safe-area-inset-top))]" style={{ backgroundColor: 'transparent' }}>
        <button onClick={onClose} className="flex items-center active:opacity-50 transition-opacity w-[60px]" style={{ color: themeConfig.textPrimary || '#333' }}>
          <ChevronLeft size={24} className="-ml-1.5" />返回
        </button>
        <div className="text-[17px] font-semibold" style={{ color: themeConfig.textPrimary || '#333' }}>
          游戏中心
        </div>
        <div className="w-[60px] flex items-center justify-end">
          <Gamepad2 size={22} style={{ color: themeConfig.textPrimary || '#333' }} />
        </div>
      </div>"""

target_content = """      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-6">"""

replacement_content = """      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto flex flex-col px-4 pt-4 pb-24 space-y-5">"""

target_wallet = """        {/* Wallet Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[24px] p-4 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-400">
              <Wallet size={20} />
            </div>
            <div>
              <div className="text-[12px] text-gray-500 font-medium">虚拟余额</div>
              <div className="text-[18px] font-bold text-gray-800">¥ {virtualBalance.toFixed(2)}</div>
            </div>
          </div>
          <div className="text-[12px] text-gray-400 max-w-[120px] text-right leading-tight">
            可用于购买游戏门票或解锁剧情
          </div>
        </motion.div>"""

replacement_wallet = """        {/* Wallet Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[20px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 text-gray-500">
              <Wallet size={20} />
            </div>
            <div>
              <div className="text-[13px] text-gray-500 font-medium">虚拟余额</div>
              <div className="text-[17px] font-bold text-gray-800 tracking-tight">¥ {virtualBalance.toFixed(2)}</div>
            </div>
          </div>
          <div className="text-[12px] text-gray-400 max-w-[120px] text-right leading-relaxed">
            可用于购买游戏门票<br/>或解锁剧情
          </div>
        </motion.div>"""

target_games = """        {/* Games List */}
        <div className="space-y-4">
          <div className="text-[14px] font-medium text-gray-500 ml-2">全部游戏</div>

          {/* Game 1: 飞行棋 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[24px] p-5 flex flex-col shadow-sm"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center bg-blue-50 text-blue-500">
                <Plane size={28} />
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-semibold text-gray-800">情侣飞行棋</div>
                <div className="text-[12px] text-gray-500 mt-1">专属两人的私密互动小游戏</div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-[16px] p-3 mb-4 flex items-start gap-2">
              <AlertCircle size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="text-[12px] text-gray-500 leading-relaxed">
                游戏内容暂未开放。您可以先消耗虚拟余额预购门票，敬请期待！
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <div className="text-[14px] font-medium" style={{ color: themeConfig.primaryColor }}>
                门票: ¥ 5.20 / 次
              </div>
              <button 
                onClick={() => handlePurchase('情侣飞行棋', 5.2)}
                className="px-5 py-2 rounded-full text-white text-[14px] font-medium active:opacity-80 transition-opacity"
                style={{ backgroundColor: themeConfig.primaryColor }}
              >
                购买门票
              </button>
            </div>
          </motion.div>

          {/* Game 2: IF线模拟器 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[24px] p-5 flex flex-col shadow-sm"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center bg-purple-50 text-purple-500">
                <Sparkles size={28} />
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-semibold text-gray-800">IF线模拟器</div>
                <div className="text-[12px] text-gray-500 mt-1">文字解密与平行时空的选择</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-[16px] p-3 mb-4 flex items-start gap-2">
              <AlertCircle size={16} className="text-gray-400 mt-0.5 shrink-0" />
              <div className="text-[12px] text-gray-500 leading-relaxed">
                故事仍在编写中。您可以先消耗虚拟余额解锁第一章预告片。
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <div className="text-[14px] font-medium" style={{ color: themeConfig.primaryColor }}>
                解锁: ¥ 13.14 / 章节
              </div>
              <button 
                onClick={() => handlePurchase('IF线模拟器', 13.14)}
                className="px-5 py-2 rounded-full text-white text-[14px] font-medium active:opacity-80 transition-opacity"
                style={{ backgroundColor: themeConfig.primaryColor }}
              >
                解锁章节
              </button>
            </div>
          </motion.div>

        </div>"""

replacement_games = """        {/* Games List */}
        <div className="space-y-4">
          <div className="text-[14px] font-medium text-gray-500 ml-2 mb-2">全部游戏</div>

          {/* Game 1: 飞行棋 (常规) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[20px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] p-5 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center bg-[#E8F0FE] text-[#1A73E8]">
                <Plane size={26} />
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-semibold text-gray-800">情侣飞行棋 <span className="text-[12px] font-normal text-gray-400 ml-1">常规版</span></div>
                <div className="text-[12px] text-gray-500 mt-0.5">专属两人的私密互动小游戏</div>
              </div>
            </div>
            
            <div className="bg-gray-50/80 rounded-[12px] p-3 mb-4 flex items-start gap-2 border border-gray-100/50">
              <AlertCircle size={15} className="text-gray-400 mt-[1px] shrink-0" />
              <div className="text-[12px] text-gray-500 leading-relaxed">
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
            className="bg-white rounded-[20px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] p-5 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center bg-[#FCE8E6] text-[#D93025]">
                <Plane size={26} />
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-semibold text-gray-800">情侣飞行棋 <span className="text-[12px] font-normal text-gray-400 ml-1">午夜版</span></div>
                <div className="text-[12px] text-gray-500 mt-0.5">进阶版互动，夜深人静时体验</div>
              </div>
            </div>
            
            <div className="bg-gray-50/80 rounded-[12px] p-3 mb-4 flex items-start gap-2 border border-gray-100/50">
              <AlertCircle size={15} className="text-gray-400 mt-[1px] shrink-0" />
              <div className="text-[12px] text-gray-500 leading-relaxed">
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
          </motion.div>

          {/* Game 3: IF线模拟器 */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-[20px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] p-5 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center bg-[#F3E8FD] text-[#9333EA]">
                <Sparkles size={26} />
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-semibold text-gray-800">IF线模拟器</div>
                <div className="text-[12px] text-gray-500 mt-0.5">文字解密与平行时空的选择</div>
              </div>
            </div>

            <div className="bg-gray-50/80 rounded-[12px] p-3 mb-4 flex items-start gap-2 border border-gray-100/50">
              <AlertCircle size={15} className="text-gray-400 mt-[1px] shrink-0" />
              <div className="text-[12px] text-gray-500 leading-relaxed">
                故事仍在编写中。您可以先消耗虚拟余额解锁第一章预告片。
              </div>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <div className="text-[14px] font-medium" style={{ color: themeConfig.primaryColor }}>
                解锁: ¥ 13.14 / 章节
              </div>
              <button 
                onClick={() => handlePurchase('IF线模拟器', 13.14)}
                className="px-5 py-2 rounded-full text-white text-[13px] font-medium active:opacity-80 transition-opacity"
                style={{ backgroundColor: themeConfig.primaryColor }}
              >
                解锁章节
              </button>
            </div>
          </motion.div>

        </div>"""

if target_header in content:
    content = content.replace(target_header, replacement_header)
if target_content in content:
    content = content.replace(target_content, replacement_content)
if target_wallet in content:
    content = content.replace(target_wallet, replacement_wallet)
if target_games in content:
    content = content.replace(target_games, replacement_games)

with open('src/GameCenterView.tsx', 'w') as f:
    f.write(content)
