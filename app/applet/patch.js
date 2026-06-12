const fs = require("fs");
let file = "src/ChatView.tsx";
let content = fs.readFileSync(file, "utf8");

// 1. Add replyingTo state
content = content.replace(
  "const [input, setInput] = useState('');",
  "const [input, setInput] = useState('');\n  const [replyingTo, setReplyingTo] = useState<Message | null>(null);"
);

// 2. Modify handleSend to include replyTo
content = content.replace(
  "const newMsg: Message = {\n      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),\n      sender: 'me',\n      type,\n      content: text,\n      time: getFormatTime(),\n      isIgnored: ignored\n    };",
  "const newMsg: Message = {\n      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),\n      sender: 'me',\n      type,\n      content: text,\n      replyTo: replyingTo ? (replyingTo.type === 'text' ? replyingTo.content : (replyingTo.type === 'voice' ? '[语音]' : '[图片/表情]')) : undefined,\n      time: getFormatTime(),\n      isIgnored: ignored\n    };"
);
content = content.replace(
  "setInput('');",
  "setInput('');\n    setReplyingTo(null);"
);

// 3. Add onDoubleClick to bubbles
content = content.replace(
  /<div className=\{\`flex flex-col \$\{isMe \? 'items-end' : 'items-start'\} max-w-\[70\%\]\`\}>/g,
  "<div onDoubleClick={() => setReplyingTo(msg)} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>"
);

// 4. Add replyingTo preview UI above input
content = content.replace(
  /<div className="w-full flex items-end space-x-2 pb-1 relative z-20">/g,
  `{replyingTo && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-black/5 text-[12px] text-black/60 mt-1 mb-2 rounded-[8px] mx-1">
              <span className="truncate flex-1">回复 {replyingTo.sender === 'me' ? '我' : 'Ta'}: {replyingTo.type === 'text' ? replyingTo.content : (replyingTo.type === 'voice' ? '[语音]' : '[图片/表情]')}</span>
              <button onClick={() => setReplyingTo(null)} className="ml-3 p-1 shrink-0 bg-black/10 rounded-full"><X size={12} /></button>
            </div>
          )}
          <div className="w-full flex items-end space-x-2 pb-1 relative z-20">`
);

fs.writeFileSync(file, content);
console.log("Patched ChatView");
