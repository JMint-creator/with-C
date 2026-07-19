with open('src/UnoGameView.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "export const UnoGameView = ({ onClose, themeConfig, myNickname = '我', mjNickname = 'AI' }: any) => {",
    "import { useLocalState } from './utils';\n\nexport const UnoGameView = ({ onClose, themeConfig }: any) => {\n  const [myNickname] = useLocalState('app_myNickname', '我');\n  const [mjNickname] = useLocalState('app_mjNickname', 'AI');"
)

with open('src/UnoGameView.tsx', 'w') as f:
    f.write(content)
