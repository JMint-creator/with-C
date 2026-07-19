import re

with open('src/GameCenterView.tsx', 'r') as f:
    content = f.read()

import_statement = "import { UnoGameView } from './UnoGameView';\n"
if "UnoGameView" not in content:
    content = content.replace("import { useIDBState } from './utils';", "import { useIDBState } from './utils';\n" + import_statement)

# Add UNO game to list
uno_game_html = """          {/* Game 3: UNO */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="backdrop-blur-xl rounded-[20px] p-5 flex flex-col shadow-sm border border-black/[0.03]" style={{ backgroundColor: themeConfig.cardBg ? themeConfig.cardBg.replace(/0\.\d+\)/, `0.8)`) : 'rgba(255,255,255,0.8)' }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-[16px] flex items-center justify-center bg-[#FFEBEE] text-[#D32F2F]">
                <div className="text-[20px] font-black italic tracking-tighter">UNO</div>
              </div>
              <div className="flex-1">
                <div className="text-[16px] font-semibold text-inherit opacity-90">UNO 纸牌</div>
                <div className="text-[12px] text-inherit opacity-60 mt-0.5">原版 UNO 规则，经典抽牌对战</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-black/[0.03]">
              <div className="text-[14px] font-medium text-inherit opacity-80">
                免费游玩
              </div>
              <button 
                onClick={() => setActiveGame('uno')}
                className="px-5 py-1.5 rounded-full text-[#333] text-[13px] font-medium active:opacity-80 transition-opacity"
                style={{ backgroundColor: themeConfig.primaryColor }}
              >
                开始游戏
              </button>
            </div>
          </motion.div>

          {/* Game 4: IF线模拟器 */}"""

content = content.replace("{/* Game 3: IF线模拟器 */}", uno_game_html.replace('Game 4', 'Game 3 (moved)'))

# Add state
if "const [activeGame, setActiveGame]" not in content:
    content = content.replace("const [toast, setToast] = useState('');", "const [toast, setToast] = useState('');\n  const [activeGame, setActiveGame] = useState<string | null>(null);")

# Render active game
active_game_render = """
  if (activeGame === 'uno') {
    return <UnoGameView onClose={() => setActiveGame(null)} themeConfig={themeConfig} />;
  }

  return (
"""
content = content.replace("  return (\n    <div \n      className=\"fixed", active_game_render + "    <div \n      className=\"fixed")

with open('src/GameCenterView.tsx', 'w') as f:
    f.write(content)
