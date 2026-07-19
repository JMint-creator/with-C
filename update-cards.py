with open('src/GameCenterView.tsx', 'r') as f:
    content = f.read()

card_style = """style={{ backgroundColor: themeConfig.cardBg ? themeConfig.cardBg.replace(/0\.\d+\)/, `0.8)`) : 'rgba(255,255,255,0.8)' }}"""

content = content.replace(
    '''className="bg-white rounded-[20px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] p-4 flex items-center justify-between"''',
    f'''className="backdrop-blur-xl rounded-[20px] p-4 flex items-center justify-between shadow-sm border border-black/[0.03]" {card_style}'''
)

content = content.replace(
    '''className="bg-white rounded-[20px] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.05)] p-5 flex flex-col"''',
    f'''className="backdrop-blur-xl rounded-[20px] p-5 flex flex-col shadow-sm border border-black/[0.03]" {card_style}'''
)

# Text color adaptations
content = content.replace('text-gray-800', 'text-inherit opacity-90')
content = content.replace('text-gray-500', 'text-inherit opacity-60')
content = content.replace('text-gray-400', 'text-inherit opacity-40')
content = content.replace('bg-gray-50/80', 'bg-black/[0.03]')
content = content.replace('bg-gray-50', 'bg-black/[0.03]')
content = content.replace('border-gray-100/50', 'border-transparent')

with open('src/GameCenterView.tsx', 'w') as f:
    f.write(content)
