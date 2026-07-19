with open('src/GameCenterView.tsx', 'r') as f:
    content = f.read()

target = """  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#F2F2F7]">
      {bgImage !== 'none' && bgImage && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: bgImage, opacity: 0.4 }}
        />
      )}
      
      {/* Header */}
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

replacement = """  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 text-[14px]" 
      style={{ 
        color: themeConfig.textPrimary || '#333',
        backgroundColor: themeConfig.bg || '#F2F2F7',
        backgroundImage: bgImage !== 'none' ? bgImage : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background Graphic overlay if no image */}
      {bgImage === 'none' && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-50">
           <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-b from-[currentColor] to-transparent opacity-10 blur-3xl"></div>
        </div>
      )}
      
      {/* Header */}
      <div className="relative pt-[env(safe-area-inset-top)] shadow-sm z-10 shrink-0 border-b border-black/5" style={{ backgroundColor: bgImage !== 'none' ? (themeConfig.bg ? themeConfig.bg + 'cc' : '#f2f2f7cc') : (themeConfig.bg || '#f2f2f7'), backdropFilter: bgImage !== 'none' ? 'blur(12px)' : 'none' }}>
        <div className="flex justify-between items-center px-4 h-14">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-transform -ml-2">
            <ChevronLeft size={24} className="mr-0.5" />
          </button>
          <div className="text-[17px] font-semibold tracking-wider relative">
             游戏中心
             <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full opacity-50 bg-[currentColor]"></div>
          </div>
          <div className="w-10 h-10 flex items-center justify-center">
             <Gamepad2 size={20} className="opacity-70" />
          </div>
        </div>
      </div>"""

content = content.replace(target, replacement)

with open('src/GameCenterView.tsx', 'w') as f:
    f.write(content)
