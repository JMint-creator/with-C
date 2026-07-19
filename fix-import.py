with open('src/UnoGameView.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { useLocalState } from './utils';\n\nexport const UnoGameView", "export const UnoGameView")

if "import { useLocalState }" not in content:
    content = content.replace("import { ChevronLeft", "import { useLocalState } from './utils';\nimport { ChevronLeft")

with open('src/UnoGameView.tsx', 'w') as f:
    f.write(content)
