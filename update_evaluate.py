import re

with open('src/BalatroGameView.tsx', 'r') as f:
    content = f.read()

old_eval = """const evaluateHand = (cards: PlayingCard[]) => {
  if (cards.length === 0) return { ...HAND_TYPES['High Card'], scoringCards: [] };
  
  const ranks = cards.map(c => c.rank);
  const suits = cards.map(c => c.suit);
  
  const rankCounts: Record<string, number> = {};
  ranks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  
  const isFlush = cards.length >= 5 && suits.every(s => s === suits[0]);
  
  const rankOrder = RANKS;
  const sortedIndices = ranks.map(r => rankOrder.indexOf(r)).sort((a, b) => a - b);
  let isStraight = false;
  if (cards.length >= 5) {
    isStraight = true;
    for (let i = 1; i < sortedIndices.length; i++) {
      if (sortedIndices[i] !== sortedIndices[i-1] + 1) {
        isStraight = false;
        break;
      }
    }
    // Special case A-2-3-4-5
    if (!isStraight && ranks.includes('A') && ranks.includes('2') && ranks.includes('3') && ranks.includes('4') && ranks.includes('5')) {
      isStraight = true;
    }
  }

  let handType = 'High Card';
  let scoringCards = [...cards];

  if (isStraight && isFlush) handType = 'Straight Flush';
  else if (counts[0] === 4) {
    handType = 'Four of a Kind';
    const quadRank = Object.keys(rankCounts).find(k => rankCounts[k] === 4);
    scoringCards = cards.filter(c => c.rank === quadRank);
  }
  else if (counts[0] === 3 && counts[1] >= 2) {
    handType = 'Full House';
    const tripRank = Object.keys(rankCounts).find(k => rankCounts[k] === 3);
    const pairRank = Object.keys(rankCounts).find(k => rankCounts[k] >= 2 && k !== tripRank);
    scoringCards = cards.filter(c => c.rank === tripRank || c.rank === pairRank);
  }
  else if (isFlush) handType = 'Flush';
  else if (isStraight) handType = 'Straight';
  else if (counts[0] === 3) {
    handType = 'Three of a Kind';
    const tripRank = Object.keys(rankCounts).find(k => rankCounts[k] === 3);
    scoringCards = cards.filter(c => c.rank === tripRank);
  }
  else if (counts[0] === 2 && counts[1] === 2) {
    handType = 'Two Pair';
    const pairRanks = Object.keys(rankCounts).filter(k => rankCounts[k] === 2);
    scoringCards = cards.filter(c => pairRanks.includes(c.rank));
  }
  else if (counts[0] === 2) {
    handType = 'Pair';
    const pairRank = Object.keys(rankCounts).find(k => rankCounts[k] === 2);
    scoringCards = cards.filter(c => c.rank === pairRank);
  }
  else {
    scoringCards = [cards.reduce((max, c) => getRankValue(c.rank) > getRankValue(max.rank) ? c : max, cards[0])];
  }

  return { ...HAND_TYPES[handType as keyof typeof HAND_TYPES], scoringCards, type: handType };
};"""

new_eval = """const evaluateHand = (cards: PlayingCard[], buffs: any[]) => {
  if (cards.length === 0) return { ...HAND_TYPES['High Card'], scoringCards: [] };
  
  const hasSmeared = buffs.some(b => b.id === 'smeared');
  const hasShortcut = buffs.some(b => b.id === 'shortcut');

  const ranks = cards.map(c => c.rank);
  const rankCounts: Record<string, number> = {};
  ranks.forEach(r => rankCounts[r] = (rankCounts[r] || 0) + 1);
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  
  const getEffectiveSuit = (suit: string) => {
    if (hasSmeared) {
      if (suit === '♥' || suit === '♦') return 'red';
      if (suit === '♠' || suit === '♣') return 'black';
    }
    return suit;
  };
  const effectiveSuits = cards.map(c => getEffectiveSuit(c.suit));
  const minReq = hasShortcut ? 4 : 5;
  
  let isFlush = false;
  let flushSuit = '';
  if (cards.length >= minReq) {
    const suitCounts: Record<string, number> = {};
    effectiveSuits.forEach(s => suitCounts[s] = (suitCounts[s] || 0) + 1);
    const flushEntry = Object.entries(suitCounts).find(([_, c]) => c >= minReq);
    if (flushEntry) {
      isFlush = true;
      flushSuit = flushEntry[0];
    }
  }
  
  const rankOrder = RANKS;
  const uniqueIndices = Array.from(new Set(ranks.map(r => rankOrder.indexOf(r)))).sort((a, b) => a - b);
  let isStraight = false;
  
  if (uniqueIndices.length >= minReq) {
    let maxSeq = 1;
    let currentSeq = 1;
    for (let i = 1; i < uniqueIndices.length; i++) {
      if (uniqueIndices[i] === uniqueIndices[i-1] + 1) {
        currentSeq++;
        maxSeq = Math.max(maxSeq, currentSeq);
      } else {
        currentSeq = 1;
      }
    }
    if (maxSeq >= minReq) isStraight = true;
    
    if (!isStraight && ranks.includes('A')) {
      const lowStraights = hasShortcut ? ['A', '2', '3', '4'] : ['A', '2', '3', '4', '5'];
      if (lowStraights.every(r => ranks.includes(r as Rank))) {
        isStraight = true;
      }
    }
  }

  let handType = 'High Card';
  let scoringCards = [...cards];

  if (isStraight && isFlush) {
    handType = 'Straight Flush';
    scoringCards = cards.filter(c => getEffectiveSuit(c.suit) === flushSuit);
  }
  else if (counts[0] === 4) {
    handType = 'Four of a Kind';
    const quadRank = Object.keys(rankCounts).find(k => rankCounts[k] === 4);
    scoringCards = cards.filter(c => c.rank === quadRank);
  }
  else if (counts[0] === 3 && counts[1] >= 2) {
    handType = 'Full House';
    const tripRank = Object.keys(rankCounts).find(k => rankCounts[k] === 3);
    const pairRank = Object.keys(rankCounts).find(k => rankCounts[k] >= 2 && k !== tripRank);
    scoringCards = cards.filter(c => c.rank === tripRank || c.rank === pairRank);
  }
  else if (isFlush) {
    handType = 'Flush';
    scoringCards = cards.filter(c => getEffectiveSuit(c.suit) === flushSuit);
  }
  else if (isStraight) {
    handType = 'Straight';
    // Simplified: in real balatro it exactly extracts the straight cards, 
    // but here we just score all selected cards for straight (as usually 4 or 5 are selected)
    scoringCards = [...cards]; 
  }
  else if (counts[0] === 3) {
    handType = 'Three of a Kind';
    const tripRank = Object.keys(rankCounts).find(k => rankCounts[k] === 3);
    scoringCards = cards.filter(c => c.rank === tripRank);
  }
  else if (counts[0] === 2 && counts[1] === 2) {
    handType = 'Two Pair';
    const pairRanks = Object.keys(rankCounts).filter(k => rankCounts[k] === 2);
    scoringCards = cards.filter(c => pairRanks.includes(c.rank));
  }
  else if (counts[0] === 2) {
    handType = 'Pair';
    const pairRank = Object.keys(rankCounts).find(k => rankCounts[k] === 2);
    scoringCards = cards.filter(c => c.rank === pairRank);
  }
  else {
    scoringCards = [cards.reduce((max, c) => getRankValue(c.rank) > getRankValue(max.rank) ? c : max, cards[0])];
  }

  return { ...HAND_TYPES[handType as keyof typeof HAND_TYPES], scoringCards, type: handType };
};"""

content = content.replace(old_eval, new_eval)


old_buffs = """const BUFFS = [
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

new_buffs = """const BUFFS = [
  { id: 'b1', name: '心有灵犀', desc: '初始出牌次数 +1', type: 'positive', price: 15, apply: (state: any) => ({...state, handsLeft: state.handsLeft + 1}) },
  { id: 'b2', name: '好运连连', desc: '所有得分倍率 x1.5', type: 'positive', price: 25, apply: (state: any) => ({...state, globalMult: state.globalMult * 1.5}) },
  { id: 'b3', name: '偷偷放水', desc: '初始弃牌次数 +2', type: 'positive', price: 10, apply: (state: any) => ({...state, discardsLeft: state.discardsLeft + 2}) },
  { id: 'b4', name: '大满足', desc: '基础分数 +50', type: 'positive', price: 15, apply: (state: any) => ({...state, baseChipsBonus: state.baseChipsBonus + 50}) },
  { id: 'b5', name: '运筹帷幄', desc: '选牌上限变为 6 张', type: 'positive', price: 20, apply: (state: any) => ({...state, maxSelect: 6}) },
  
  { id: 'smiley_face', name: '微笑表情', desc: '计分的人头牌(J,Q,K)每张 +2 倍率', type: 'positive', price: 18, apply: (state: any) => state },
  { id: 'scary_face', name: '恐怖面孔', desc: '计分的人头牌每张 +30 分数', type: 'positive', price: 15, apply: (state: any) => state },
  { id: 'fibonacci', name: '斐波那契', desc: '计分的 A,2,3,5,8 每张 +3 倍率', type: 'positive', price: 20, apply: (state: any) => state },
  { id: 'even_steven', name: '偶数史蒂文', desc: '计分的 2,4,6,8,10 每张 +20 分数', type: 'positive', price: 15, apply: (state: any) => state },
  
  { id: 'smeared', name: '模糊小丑', desc: '红心与方块、黑桃与梅花视为同花色', type: 'positive', price: 22, apply: (state: any) => state },
  { id: 'shortcut', name: '捷径', desc: '4张牌即可组成同花或顺子', type: 'positive', price: 25, apply: (state: any) => state },
  { id: 'four_suits', name: '贪婪小丑', desc: '任何花色计分时均 +4 倍率', type: 'positive', price: 20, apply: (state: any) => state },

  { id: 'd1', name: '小恶魔的玩笑', desc: '初始出牌次数 -1', type: 'negative', price: 0, apply: (state: any) => ({...state, handsLeft: Math.max(1, state.handsLeft - 1)}) },
  { id: 'd2', name: '粗心大意', desc: '初始弃牌次数 -1', type: 'negative', price: 0, apply: (state: any) => ({...state, discardsLeft: Math.max(0, state.discardsLeft - 1)}) },
  { id: 'd3', name: '手滑了', desc: '选牌上限变为 4 张', type: 'negative', price: 0, apply: (state: any) => ({...state, maxSelect: 4}) },
];"""

content = content.replace(old_buffs, new_buffs)

old_play_call = "const evalResult = evaluateHand(selectedCards);"
new_play_call = """
    const allBuffs = [...activeBuffs];
    if (buff && buff.type === 'positive') allBuffs.push(buff);
    const evalResult = evaluateHand(selectedCards, allBuffs);"""

content = content.replace(old_play_call, new_play_call)

old_buffs_calc = """    const allBuffs = [...activeBuffs];
    if (buff && buff.type === 'positive') allBuffs.push(buff);

    allBuffs.forEach(b => {"""
new_buffs_calc = """    allBuffs.forEach(b => {"""

content = content.replace(old_buffs_calc, new_buffs_calc)


old_four_suits = """      if (b.id === 'even_steven') {
        const count = evalResult.scoringCards.filter(c => ['2', '4', '6', '8', '10'].includes(c.rank)).length;
        totalChips += count * 20;
      }
    });"""

new_four_suits = """      if (b.id === 'even_steven') {
        const count = evalResult.scoringCards.filter(c => ['2', '4', '6', '8', '10'].includes(c.rank)).length;
        totalChips += count * 20;
      }
      if (b.id === 'four_suits') {
        const count = evalResult.scoringCards.length;
        totalMult += count * 4;
      }
    });"""
    
content = content.replace(old_four_suits, new_four_suits)


with open('src/BalatroGameView.tsx', 'w') as f:
    f.write(content)

