import re

with open('src/GameCenterView.tsx', 'r') as f:
    content = f.read()

import_statement = "import { BalatroGameView } from './BalatroGameView';\n"
if "BalatroGameView" not in content:
    content = content.replace("import { UnoGameView } from './UnoGameView';", "import { UnoGameView } from './UnoGameView';\n" + import_statement)


button_target = """              <button 
                onClick={() => handlePurchase('小丑牌', 666)}
                className="px-5 py-1.5 rounded-full text-[#333] text-[13px] font-medium active:opacity-80 transition-opacity"
                style={{ backgroundColor: themeConfig.primaryColor }}
              >
                购买门票
              </button>"""

button_replacement = """              <button 
                onClick={() => handlePurchase('小丑牌', 666, () => setActiveGame('balatro'))}
                className="px-5 py-1.5 rounded-full text-[#333] text-[13px] font-medium active:opacity-80 transition-opacity"
                style={{ backgroundColor: themeConfig.primaryColor }}
              >
                购买门票
              </button>"""

if button_target in content:
    content = content.replace(button_target, button_replacement)


# Render active game
active_game_render = """
  if (activeGame === 'uno') {
    return <UnoGameView onClose={() => setActiveGame(null)} themeConfig={themeConfig} />;
  }

  if (activeGame === 'balatro') {
    return <BalatroGameView onClose={() => setActiveGame(null)} themeConfig={themeConfig} />;
  }

  return (
"""

if "if (activeGame === 'balatro')" not in content:
    content = content.replace("""  if (activeGame === 'uno') {
    return <UnoGameView onClose={() => setActiveGame(null)} themeConfig={themeConfig} />;
  }

  return (""", active_game_render)


with open('src/GameCenterView.tsx', 'w') as f:
    f.write(content)
