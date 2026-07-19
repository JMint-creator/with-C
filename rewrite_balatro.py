import re

with open('src/BalatroGameView.tsx', 'r') as f:
    content = f.read()

new_content = """import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Sparkles, AlertTriangle, Play, RefreshCw, X, ArrowRight, ShoppingBag } from 'lucide-react';
import { useLocalState } from './utils';

type Suit = '♠' | '♥' | '♦' | '♣';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

interface PlayingCard {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
}

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const getRankValue = (rank: Rank) => {
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  if (rank === 'A') return 11;
  return parseInt(rank, 10);
};

const generateDeck = (): PlayingCard[] => {
  const deck: PlayingCard[] = [];
  let id = 0;
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `card_${id++}`, suit, rank, value: getRankValue(rank) });
    }
  }
  return deck.sort(() => Math.random() - 0.5);
};

const HAND_TYPES = {
  'Straight Flush': { chips: 100, mult: 8, name: '同花顺' },
  'Four of a Kind': { chips: 60, mult: 7, name: '四条' },
  'Full House':     { chips: 40, mult: 4, name: '葫芦' },
  'Flush':          { chips: 35, mult: 4, name: '同花' },
  'Straight':       { chips: 30, mult: 4, name: '顺子' },
  'Three of a Kind':{ chips: 30, mult: 3, name: '三条' },
  'Two Pair':       { chips: 20, mult: 2, name: '两对' },
  'Pair':           { chips: 10, mult: 2, name: '一对' },
  'High Card':      { chips: 5,  mult: 1, name: '高牌' },
};

const evaluateHand = (cards: PlayingCard[]) => {
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
};

const BUFFS = [
  { id: 'b1', name: '心有灵犀', desc: '初始出牌次数 +1', type: 'positive', price: 40, apply: (state: any) => ({...state, handsLeft: state.handsLeft + 1}) },
  { id: 'b2', name: '好运连连', desc: '所有得分倍率 x1.5', type: 'positive', price: 60, apply: (state: any) => ({...state, globalMult: state.globalMult * 1.5}) },
  { id: 'b3', name: '偷偷放水', desc: '初始弃牌次数 +2', type: 'positive', price: 30, apply: (state: any) => ({...state, discardsLeft: state.discardsLeft + 2}) },
  { id: 'b4', name: '大满足', desc: '基础分数 +50', type: 'positive', price: 45, apply: (state: any) => ({...state, baseChipsBonus: state.baseChipsBonus + 50}) },
  { id: 'b5', name: '运筹帷幄', desc: '选牌上限变为 6 张', type: 'positive', price: 80, apply: (state: any) => ({...state, maxSelect: 6}) },
  { id: 'd1', name: '小恶魔的玩笑', desc: '初始出牌次数 -1', type: 'negative', price: 0, apply: (state: any) => ({...state, handsLeft: Math.max(1, state.handsLeft - 1)}) },
  { id: 'd2', name: '粗心大意', desc: '初始弃牌次数 -1', type: 'negative', price: 0, apply: (state: any) => ({...state, discardsLeft: Math.max(0, state.discardsLeft - 1)}) },
  { id: 'd3', name: '手滑了', desc: '选牌上限变为 4 张', type: 'negative', price: 0, apply: (state: any) => ({...state, maxSelect: 4}) },
];

const POSITIVE_BUFFS = BUFFS.filter(b => b.type === 'positive');

const ROUNDS = [
  { level: 1, name: '小盲注', targetScore: 1000, description: '练手关卡', bossEffect: null },
  { level: 2, name: '大盲注', targetScore: 2500, description: '渐入佳境', bossEffect: null },
  { level: 3, name: 'Boss盲注 - 坚石', targetScore: 5000, description: '超高目标分数，且基础分数减半！', bossEffect: '坚石' }
];

export const BalatroGameView = ({ onClose, themeConfig }: any) => {
  const [mjNickname] = useLocalState('app_mjNickname', '梦角');
  
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'round_won' | 'shop' | 'game_won' | 'lost'>('intro');
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);

  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [hand, setHand] = useState<PlayingCard[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [score, setScore] = useState(0);
  
  const [handsLeft, setHandsLeft] = useState(4);
  const [discardsLeft, setDiscardsLeft] = useState(3);
  
  const [buff, setBuff] = useState<any>(null); // Initial dream blessing
  const [activeBuffs, setActiveBuffs] = useState<any[]>([]); // Bought in shop
  const [money, setMoney] = useState(0);
  const [earnedMoney, setEarnedMoney] = useState(0);
  const [shopItems, setShopItems] = useState<any[]>([]);

  const [globalMult, setGlobalMult] = useState(1);
  const [baseChipsBonus, setBaseChipsBonus] = useState(0);
  const [maxSelect, setMaxSelect] = useState(5);

  const [lastPlayInfo, setLastPlayInfo] = useState<{name: string, score: number, cards: PlayingCard[]} | null>(null);

  const currentRound = ROUNDS[currentRoundIndex];

  const startNewGame = () => {
    const randomBuff = BUFFS[Math.floor(Math.random() * BUFFS.length)];
    setBuff(randomBuff);
    setActiveBuffs([]);
    setMoney(0);
    setCurrentRoundIndex(0);
    startRound(0, randomBuff, []);
  };

  const startRound = (roundIndex: number, currentBuff: any = buff, currentActiveBuffs: any[] = activeBuffs) => {
    let initialState = {
      handsLeft: 4,
      discardsLeft: 3,
      globalMult: 1,
      baseChipsBonus: 0,
      maxSelect: 5
    };
    
    // Apply dream blessing
    if (currentBuff) {
      initialState = currentBuff.apply(initialState);
    }

    // Apply shop buffs
    currentActiveBuffs.forEach(b => {
      initialState = b.apply(initialState);
    });
    
    setHandsLeft(initialState.handsLeft);
    setDiscardsLeft(initialState.discardsLeft);
    setGlobalMult(initialState.globalMult);
    setBaseChipsBonus(initialState.baseChipsBonus);
    setMaxSelect(initialState.maxSelect);
    
    const newDeck = generateDeck();
    setHand(newDeck.slice(0, 8));
    setDeck(newDeck.slice(8));
    setScore(0);
    setSelectedIds(new Set());
    setLastPlayInfo(null);
    setGameState('playing');
  };

  const handleNextRound = () => {
    const nextIndex = currentRoundIndex + 1;
    setCurrentRoundIndex(nextIndex);
    startRound(nextIndex);
  };

  const enterShop = () => {
    // Generate 3 random shop items
    const items = [...POSITIVE_BUFFS].sort(() => Math.random() - 0.5).slice(0, 3).map(b => ({ ...b, uniqueId: Math.random().toString() }));
    setShopItems(items);
    setGameState('shop');
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      if (newSet.size < maxSelect) {
        newSet.add(id);
      }
    }
    setSelectedIds(newSet);
  };

  const handleDiscard = () => {
    if (discardsLeft <= 0 || selectedIds.size === 0) return;
    
    const newHand = hand.filter(c => !selectedIds.has(c.id));
    const toDraw = 8 - newHand.length;
    
    const drawn = deck.slice(0, toDraw);
    setHand([...newHand, ...drawn]);
    setDeck(deck.slice(toDraw));
    setSelectedIds(new Set());
    setDiscardsLeft(prev => prev - 1);
  };

  const handlePlay = () => {
    if (handsLeft <= 0 || selectedIds.size === 0) return;

    const selectedCards = hand.filter(c => selectedIds.has(c.id));
    const evalResult = evaluateHand(selectedCards);
    
    const cardChips = selectedCards.reduce((acc, c) => acc + c.value, 0);
    let totalChips = evalResult.chips + cardChips + baseChipsBonus;
    let totalMult = evalResult.mult * globalMult;

    // Boss effect
    if (currentRound.bossEffect === '坚石') {
        totalChips = Math.max(1, Math.floor(totalChips / 2));
    }

    const playScore = Math.floor(totalChips * totalMult);
    
    const newScore = score + playScore;
    setScore(newScore);
    setLastPlayInfo({
      name: evalResult.name,
      score: playScore,
      cards: selectedCards
    });

    const newHand = hand.filter(c => !selectedIds.has(c.id));
    const toDraw = 8 - newHand.length;
    const drawn = deck.slice(0, toDraw);
    
    setHand([...newHand, ...drawn]);
    setDeck(deck.slice(toDraw));
    setSelectedIds(new Set());
    
    const newHandsLeft = handsLeft - 1;
    setHandsLeft(newHandsLeft);

    if (newScore >= currentRound.targetScore) {
      const earned = 20 + newHandsLeft * 10 + discardsLeft * 5;
      setEarnedMoney(earned);
      setMoney(prev => prev + earned);

      if (currentRoundIndex === ROUNDS.length - 1) {
        setTimeout(() => setGameState('game_won'), 1000);
      } else {
        setTimeout(() => setGameState('round_won'), 1000);
      }
    } else if (newHandsLeft <= 0) {
      setTimeout(() => setGameState('lost'), 1000);
    }
  };

  const buyItem = (item: any) => {
    if (money >= item.price) {
      setMoney(prev => prev - item.price);
      setActiveBuffs(prev => [...prev, item]);
      setShopItems(prev => prev.filter(i => i.uniqueId !== item.uniqueId));
    }
  };

  const getSuitColor = (suit: Suit) => {
    return (suit === '♥' || suit === '♦') ? '#FF5252' : '#333333';
  };

  const CardComponent = ({ card, selected, onClick, small = false }: any) => {
    return (
      <motion.div 
        whileHover={onClick ? { y: -5 } : {}}
        whileTap={onClick ? { scale: 0.95 } : {}}
        onClick={onClick}
        className={`relative rounded-[12px] bg-white flex flex-col items-center shadow-sm select-none border-2 transition-colors ${selected ? 'border-[#1A73E8] shadow-md shadow-[#1A73E8]/20' : 'border-gray-200'} ${onClick ? 'cursor-pointer' : ''}`}
        style={{ 
          width: small ? '3rem' : '4rem', 
          height: small ? '4.5rem' : '6rem',
          transform: selected ? 'translateY(-10px)' : 'none',
        }}
      >
        <div className={`absolute top-1 left-1.5 font-bold ${small ? 'text-[12px]' : 'text-[16px]'}`} style={{ color: getSuitColor(card.suit) }}>
          {card.rank}
        </div>
        <div className={`absolute top-5 left-1.5 ${small ? 'text-[14px]' : 'text-[20px]'}`} style={{ color: getSuitColor(card.suit) }}>
          {card.suit}
        </div>
        <div className={`absolute bottom-1 right-1.5 font-bold ${small ? 'text-[12px]' : 'text-[16px]'} rotate-180`} style={{ color: getSuitColor(card.suit) }}>
          {card.rank}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0F172A] overflow-hidden text-white font-sans">
      <div className="relative pt-[env(safe-area-inset-top)] z-10 shrink-0 bg-[#0F172A]/80 backdrop-blur-md border-b border-white/10">
        <div className="flex justify-between items-center px-4 h-14">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-transform -ml-2 text-white/80">
            <ChevronLeft size={24} className="mr-0.5" />
          </button>
          <div className="text-[17px] font-semibold tracking-wider relative text-white/90">
             小丑牌
          </div>
          <div className="w-10 h-10 flex items-center justify-center font-mono font-bold text-yellow-400">
             ${money}
          </div>
        </div>
      </div>

      {gameState === 'intro' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#0F172A]">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#F57F17] to-[#F9A825] flex items-center justify-center shadow-lg shadow-[#F57F17]/30 mb-6">
            <span className="text-[40px]">🃏</span>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-white">小丑牌</h2>
          <p className="text-white/60 text-center mb-8 text-sm max-w-[260px] leading-relaxed">
            组成扑克牌型获得分数。<br/>
            击败所有盲注，在商店购买增益！
          </p>
          <button 
            onClick={startNewGame}
            className="w-full max-w-[240px] py-3.5 rounded-full text-[#333] font-semibold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 bg-[#F57F17] hover:bg-[#F9A825]"
          >
            <Play size={18} fill="currentColor" /> 获取 {mjNickname} 的祝福并开始
          </button>
        </div>
      ) : gameState === 'shop' ? (
        <div className="flex-1 flex flex-col p-6 relative overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-400">
              <ShoppingBag size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">商店</h2>
              <p className="text-sm text-white/50">购买增益效果以备战下一回合</p>
            </div>
            <div className="ml-auto text-2xl font-mono font-bold text-yellow-400">${money}</div>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            {shopItems.length > 0 ? shopItems.map((item) => (
              <div key={item.uniqueId} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-lg">{item.name}</h3>
                    <p className="text-sm text-white/60 mt-0.5">{item.desc}</p>
                  </div>
                  <div className="font-mono font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded">
                    ${item.price}
                  </div>
                </div>
                <button 
                  onClick={() => buyItem(item)}
                  disabled={money < item.price}
                  className="w-full py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 disabled:bg-gray-600 bg-yellow-500 text-slate-900 active:scale-95"
                >
                  购买
                </button>
              </div>
            )) : (
              <div className="flex-1 flex items-center justify-center text-white/40">
                商店已被买空
              </div>
            )}
          </div>

          {/* Player's Active Buffs Summary */}
          {activeBuffs.length > 0 && (
            <div className="mt-8 mb-6">
              <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3">你已拥有的增益</h3>
              <div className="flex flex-wrap gap-2">
                {activeBuffs.map((b, i) => (
                  <span key={i} className="text-xs font-medium px-2 py-1 bg-purple-500/20 text-purple-200 rounded border border-purple-500/30">
                    {b.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-auto pt-6 pb-[env(safe-area-inset-bottom)]">
            <button 
              onClick={handleNextRound}
              className="w-full py-4 rounded-xl font-bold transition-all bg-white text-slate-900 active:scale-95 flex justify-center items-center gap-2"
            >
              继续下一关 <ArrowRight size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col relative">
          {/* Top Bar Stats */}
          <div className="flex px-4 py-3 gap-3 bg-white/5 border-b border-white/5">
            <div className="flex-1 bg-black/40 rounded-xl p-3 flex flex-col border border-white/5 shadow-inner">
              <div className="flex justify-between items-center mb-1">
                <span className="text-white/50 text-[11px] font-bold uppercase tracking-wider">分数</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${currentRound.bossEffect ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70'}`}>
                  {currentRoundIndex + 1}/{ROUNDS.length} {currentRound.name}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{score}</span>
                <span className="text-white/40 text-sm">/ {currentRound.targetScore}</span>
              </div>
            </div>
            <div className="w-[100px] flex flex-col gap-2">
              <div className="bg-blue-500/20 rounded-lg p-1.5 flex justify-between items-center border border-blue-500/30">
                <span className="text-blue-200/80 text-[11px] font-bold ml-1">出牌</span>
                <span className="text-blue-400 font-bold px-2">{handsLeft}</span>
              </div>
              <div className="bg-red-500/20 rounded-lg p-1.5 flex justify-between items-center border border-red-500/30">
                <span className="text-red-200/80 text-[11px] font-bold ml-1">弃牌</span>
                <span className="text-red-400 font-bold px-2">{discardsLeft}</span>
              </div>
            </div>
          </div>

          {/* Buff Display */}
          {(buff || activeBuffs.length > 0) && (
            <div className="mx-4 mt-3 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30 rounded-xl p-3 flex flex-col gap-2 shadow-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${buff.type === 'positive' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {buff.type === 'positive' ? <Sparkles size={16} /> : <AlertTriangle size={16} />}
                </div>
                <div className="flex-1">
                  <div className="text-[11px] text-purple-200/60 mb-0.5">{mjNickname} 的附加效果</div>
                  <div className="text-[13px] font-medium text-purple-100">{buff.name}: {buff.desc}</div>
                </div>
              </div>
              {activeBuffs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {activeBuffs.map((b, i) => (
                    <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 bg-white/10 text-white rounded">
                      {b.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Boss Effect Display */}
          {currentRound.bossEffect && (
            <div className="mx-4 mt-2 bg-red-500/20 border border-red-500/30 rounded-xl p-3 flex items-center gap-3 shadow-lg">
              <div className="flex-1">
                <div className="text-[12px] text-red-300/80 mb-0.5">⚠️ 盲注效果激活</div>
                <div className="text-[13px] font-bold text-red-200">{currentRound.bossEffect}: 基础分数减半！</div>
              </div>
            </div>
          )}

          {/* Play Area */}
          <div className="flex-1 flex flex-col items-center justify-center py-4">
            <AnimatePresence mode="wait">
              {lastPlayInfo ? (
                <motion.div 
                  key="last-play"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex flex-col items-center"
                >
                  <div className="text-lg font-bold text-[#F57F17] mb-1">{lastPlayInfo.name}</div>
                  <div className="text-3xl font-black text-white mb-4">+{lastPlayInfo.score}</div>
                  <div className="flex gap-2">
                    {lastPlayInfo.cards.map(c => <CardComponent key={`play-${c.id}`} card={c} small={true} />)}
                  </div>
                </motion.div>
              ) : (
                <div key="empty-play" className="text-white/20 text-sm font-medium tracking-widest uppercase">
                  选择牌来出牌
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Hand & Controls */}
          <div className="pb-[calc(1.5rem+env(safe-area-inset-bottom))] px-4 flex flex-col gap-4">
            {/* Cards */}
            <div className="flex justify-center flex-wrap gap-x-2 gap-y-4">
              <AnimatePresence>
                {hand.map((c) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <CardComponent 
                      card={c} 
                      selected={selectedIds.has(c.id)}
                      onClick={() => toggleSelect(c.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            {/* Buttons */}
            <div className="flex gap-3 mt-4">
              <button 
                onClick={handleDiscard}
                disabled={selectedIds.size === 0 || discardsLeft <= 0}
                className="flex-1 py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-30 border border-red-500/30 bg-red-500/10 active:bg-red-500/20"
              >
                弃牌
              </button>
              <button 
                onClick={handlePlay}
                disabled={selectedIds.size === 0 || handsLeft <= 0}
                className="flex-1 py-3.5 rounded-xl font-bold text-slate-900 transition-all disabled:opacity-30 bg-[#F57F17] active:bg-[#F9A825]"
              >
                出牌
              </button>
            </div>
          </div>

          {/* End Game/Round Modal */}
          <AnimatePresence>
            {(gameState === 'game_won' || gameState === 'lost' || gameState === 'round_won') && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0F172A]/80 backdrop-blur-sm p-6">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-[#1E293B] border border-white/10 rounded-3xl p-8 flex flex-col items-center w-full max-w-sm shadow-2xl"
                >
                  <div className="text-6xl mb-4">
                    {gameState === 'game_won' ? '🏆' : gameState === 'lost' ? '💔' : '🎉'}
                  </div>
                  <div className="text-2xl font-bold mb-2 text-white text-center">
                    {gameState === 'game_won' ? '通关成功！' : gameState === 'lost' ? '目标未达成' : `${currentRound.name} 击败！`}
                  </div>
                  <div className="text-white/60 mb-8 text-center text-[15px]">
                    {gameState === 'game_won' 
                      ? `你成功通关了所有盲注，太厉害了！` 
                      : gameState === 'lost' 
                      ? `很遗憾，倒在了 ${currentRound.name}。再试一次吧！`
                      : (
                        <>
                          本回合获得金币: <strong className="text-yellow-400">${earnedMoney}</strong><br/>
                          准备好迎接下一个挑战了吗？
                        </>
                      )}
                  </div>
                  <button 
                    onClick={gameState === 'round_won' ? enterShop : startNewGame}
                    className="w-full py-3.5 rounded-full text-slate-900 font-bold shadow-md active:scale-95 transition-all bg-white flex items-center justify-center gap-2"
                  >
                    {gameState === 'round_won' ? <>前往商店 <ArrowRight size={18} /></> : '再来一局'}
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}
    </div>
  );
};
"""

with open('src/BalatroGameView.tsx', 'w') as f:
    f.write(new_content)

