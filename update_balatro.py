import re

with open('src/BalatroGameView.tsx', 'r') as f:
    content = f.read()

# Replace BUFFS definition
old_buffs = """const BUFFS = [
  { id: 'b1', name: '心有灵犀', desc: '初始出牌次数 +1', type: 'positive', price: 40, apply: (state: any) => ({...state, handsLeft: state.handsLeft + 1}) },
  { id: 'b2', name: '好运连连', desc: '所有得分倍率 x1.5', type: 'positive', price: 60, apply: (state: any) => ({...state, globalMult: state.globalMult * 1.5}) },
  { id: 'b3', name: '偷偷放水', desc: '初始弃牌次数 +2', type: 'positive', price: 30, apply: (state: any) => ({...state, discardsLeft: state.discardsLeft + 2}) },
  { id: 'b4', name: '大满足', desc: '基础分数 +50', type: 'positive', price: 45, apply: (state: any) => ({...state, baseChipsBonus: state.baseChipsBonus + 50}) },
  { id: 'b5', name: '运筹帷幄', desc: '选牌上限变为 6 张', type: 'positive', price: 80, apply: (state: any) => ({...state, maxSelect: 6}) },
  { id: 'd1', name: '小恶魔的玩笑', desc: '初始出牌次数 -1', type: 'negative', price: 0, apply: (state: any) => ({...state, handsLeft: Math.max(1, state.handsLeft - 1)}) },
  { id: 'd2', name: '粗心大意', desc: '初始弃牌次数 -1', type: 'negative', price: 0, apply: (state: any) => ({...state, discardsLeft: Math.max(0, state.discardsLeft - 1)}) },
  { id: 'd3', name: '手滑了', desc: '选牌上限变为 4 张', type: 'negative', price: 0, apply: (state: any) => ({...state, maxSelect: 4}) },
];"""

new_buffs = """const BUFFS = [
  { id: 'b1', name: '心有灵犀', desc: '初始出牌次数 +1', type: 'positive', price: 25, apply: (state: any) => ({...state, handsLeft: state.handsLeft + 1}) },
  { id: 'b2', name: '好运连连', desc: '所有得分倍率 x1.5', type: 'positive', price: 40, apply: (state: any) => ({...state, globalMult: state.globalMult * 1.5}) },
  { id: 'b3', name: '偷偷放水', desc: '初始弃牌次数 +2', type: 'positive', price: 15, apply: (state: any) => ({...state, discardsLeft: state.discardsLeft + 2}) },
  { id: 'b4', name: '大满足', desc: '基础分数 +50', type: 'positive', price: 20, apply: (state: any) => ({...state, baseChipsBonus: state.baseChipsBonus + 50}) },
  { id: 'b5', name: '运筹帷幄', desc: '选牌上限变为 6 张', type: 'positive', price: 35, apply: (state: any) => ({...state, maxSelect: 6}) },
  
  { id: 'smiley_face', name: '微笑表情', desc: '计分的人头牌(J,Q,K)每张 +2 倍率', type: 'positive', price: 25, apply: (state: any) => state },
  { id: 'scary_face', name: '恐怖面孔', desc: '计分的人头牌每张 +30 分数', type: 'positive', price: 20, apply: (state: any) => state },
  { id: 'fibonacci', name: '斐波那契', desc: '计分的 A,2,3,5,8 每张 +3 倍率', type: 'positive', price: 30, apply: (state: any) => state },
  { id: 'even_steven', name: '偶数史蒂文', desc: '计分的 2,4,6,8,10 每张 +20 分数', type: 'positive', price: 20, apply: (state: any) => state },

  { id: 'd1', name: '小恶魔的玩笑', desc: '初始出牌次数 -1', type: 'negative', price: 0, apply: (state: any) => ({...state, handsLeft: Math.max(1, state.handsLeft - 1)}) },
  { id: 'd2', name: '粗心大意', desc: '初始弃牌次数 -1', type: 'negative', price: 0, apply: (state: any) => ({...state, discardsLeft: Math.max(0, state.discardsLeft - 1)}) },
  { id: 'd3', name: '手滑了', desc: '选牌上限变为 4 张', type: 'negative', price: 0, apply: (state: any) => ({...state, maxSelect: 4}) },
];"""

content = content.replace(old_buffs, new_buffs)


old_play = """    const cardChips = selectedCards.reduce((acc, c) => acc + c.value, 0);
    let totalChips = evalResult.chips + cardChips + baseChipsBonus;
    let totalMult = evalResult.mult * globalMult;

    // Boss effect
    if (currentRound.bossEffect === '坚石') {
        totalChips = Math.max(1, Math.floor(totalChips / 2));
    }

    const playScore = Math.floor(totalChips * totalMult);"""

new_play = """    const cardChips = selectedCards.reduce((acc, c) => acc + c.value, 0);
    let totalChips = evalResult.chips + cardChips + baseChipsBonus;
    let totalMult = evalResult.mult * globalMult;
    
    const allBuffs = [...activeBuffs];
    if (buff && buff.type === 'positive') allBuffs.push(buff);

    allBuffs.forEach(b => {
      if (b.id === 'smiley_face') {
        const count = evalResult.scoringCards.filter(c => ['J', 'Q', 'K'].includes(c.rank)).length;
        totalMult += count * 2;
      }
      if (b.id === 'scary_face') {
        const count = evalResult.scoringCards.filter(c => ['J', 'Q', 'K'].includes(c.rank)).length;
        totalChips += count * 30;
      }
      if (b.id === 'fibonacci') {
        const count = evalResult.scoringCards.filter(c => ['A', '2', '3', '5', '8'].includes(c.rank)).length;
        totalMult += count * 3;
      }
      if (b.id === 'even_steven') {
        const count = evalResult.scoringCards.filter(c => ['2', '4', '6', '8', '10'].includes(c.rank)).length;
        totalChips += count * 20;
      }
    });

    // Boss effect
    if (currentRound.bossEffect === '坚石') {
        totalChips = Math.max(1, Math.floor(totalChips / 2));
    }

    const playScore = Math.floor(totalChips * totalMult);"""

content = content.replace(old_play, new_play)

old_money = """    if (newScore >= currentRound.targetScore) {
      const earned = 20 + newHandsLeft * 10 + discardsLeft * 5;
      setEarnedMoney(earned);"""

new_money = """    if (newScore >= currentRound.targetScore) {
      const earned = 30 + newHandsLeft * 15 + discardsLeft * 5;
      setEarnedMoney(earned);"""

content = content.replace(old_money, new_money)

with open('src/BalatroGameView.tsx', 'w') as f:
    f.write(content)

