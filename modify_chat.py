import re

with open('src/ChatView.tsx', 'r') as f:
    content = f.read()

target = """    if (!ignored) {
      simulateReply();
    }
  };"""

replacement = """    if (!ignored) {
      if (type === 'text' && (text.includes('打钱') || text.includes('没钱') || text.includes('充值') || text.includes('穷'))) {
        setIsTyping(true);
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
            sender: 'them',
            type: 'red_envelope',
            content: '拿去花，不够再和我说',
            time: getFormatTime(),
            redEnvelopeAmount: 8888,
            redEnvelopeStatus: 'unopened'
          }]);
          setIsTyping(false);
        }, 1500);
      } else {
        simulateReply();
      }
    }
  };"""

content = content.replace(target, replacement)

with open('src/ChatView.tsx', 'w') as f:
    f.write(content)

