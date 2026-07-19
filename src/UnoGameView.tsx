import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalState } from './utils';
import { ChevronLeft, User, Bot, Play } from 'lucide-react';

type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | '+2' | 'wild' | '+4';

interface UnoCard {
  id: string;
  color: CardColor;
  value: CardValue;
}

const COLORS: CardColor[] = ['red', 'blue', 'green', 'yellow'];
const VALUES: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', '+2'];

const generateDeck = (): UnoCard[] => {
  const deck: UnoCard[] = [];
  let id = 0;
  for (const color of COLORS) {
    deck.push({ id: `card_${id++}`, color, value: '0' });
    for (let i = 1; i <= 9; i++) {
      deck.push({ id: `card_${id++}`, color, value: i.toString() as CardValue });
      deck.push({ id: `card_${id++}`, color, value: i.toString() as CardValue });
    }
    for (const val of ['skip', 'reverse', '+2'] as CardValue[]) {
      deck.push({ id: `card_${id++}`, color, value: val });
      deck.push({ id: `card_${id++}`, color, value: val });
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `card_${id++}`, color: 'wild', value: 'wild' });
    deck.push({ id: `card_${id++}`, color: 'wild', value: '+4' });
  }
  return deck.sort(() => Math.random() - 0.5);
};

export const UnoGameView = ({ onClose, themeConfig }: any) => {
  const [myNickname] = useLocalState('app_myNickname', '我');
  const [mjNickname] = useLocalState('app_mjNickname', '梦角');
  const [deck, setDeck] = useState<UnoCard[]>([]);
  const [playerHand, setPlayerHand] = useState<UnoCard[]>([]);
  const [aiHand, setAiHand] = useState<UnoCard[]>([]);
  const [discardPile, setDiscardPile] = useState<UnoCard[]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'player' | 'ai'>('player');
  const [currentColor, setCurrentColor] = useState<CardColor>('red');
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState<UnoCard | null>(null);
  
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    let initialDeck = generateDeck();
    const pHand = initialDeck.slice(0, 7);
    const aHand = initialDeck.slice(7, 14);
    initialDeck = initialDeck.slice(14);
    
    // find a valid starting card (no wild/+4/etc)
    let firstCardIdx = initialDeck.findIndex(c => c.color !== 'wild' && !['skip', 'reverse', '+2'].includes(c.value));
    if (firstCardIdx === -1) firstCardIdx = 0;
    
    const firstCard = initialDeck[firstCardIdx];
    initialDeck.splice(firstCardIdx, 1);
    
    setPlayerHand(pHand);
    setAiHand(aHand);
    setDiscardPile([firstCard]);
    setCurrentColor(firstCard.color !== 'wild' ? firstCard.color : 'red');
    setDeck(initialDeck);
    setCurrentPlayer('player');
    setWinner(null);
    setGameStarted(true);
  };

  const drawCard = (count: number = 1, currentDeck = deck): { drawn: UnoCard[], remaining: UnoCard[] } => {
    let d = [...currentDeck];
    const drawn: UnoCard[] = [];
    for (let i = 0; i < count; i++) {
      if (d.length === 0) {
        // reshuffle discard pile (keep top card)
        const top = discardPile[discardPile.length - 1];
        const toShuffle = discardPile.slice(0, -1).map(c => ({...c, id: `reshuffle_${Math.random()}`}));
        d = toShuffle.sort(() => Math.random() - 0.5);
        setDiscardPile([top]);
      }
      if (d.length > 0) {
        drawn.push(d.pop()!);
      }
    }
    return { drawn, remaining: d };
  };

  const checkWin = (pHand: UnoCard[], aHand: UnoCard[]) => {
    if (pHand.length === 0) {
      setWinner('player');
      return true;
    }
    if (aHand.length === 0) {
      setWinner('ai');
      return true;
    }
    return false;
  };

  const handleAiTurn = useCallback(() => {
    if (winner || currentPlayer === 'player') return;

    setTimeout(() => {
      const topCard = discardPile[discardPile.length - 1];
      const validCards = aiHand.filter(c => 
        c.color === 'wild' || c.color === currentColor || c.value === topCard.value
      );

      if (validCards.length > 0) {
        // play a card
        const cardToPlay = validCards[Math.floor(Math.random() * validCards.length)];
        let newAiHand = aiHand.filter(c => c.id !== cardToPlay.id);
        
        let nextColor = currentColor;
        let nextPlayer: 'player'|'ai' = 'player';
        let currentDeck = deck;
        let newPlayerHand = [...playerHand];

        if (cardToPlay.color === 'wild') {
          // AI picks color randomly
          const colorCounts: Record<string, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
          newAiHand.forEach(c => { if(c.color !== 'wild') colorCounts[c.color]++ });
          const bestColor = Object.keys(colorCounts).reduce((a, b) => colorCounts[a] > colorCounts[b] ? a : b) as CardColor;
          nextColor = bestColor;
        } else {
          nextColor = cardToPlay.color;
        }

        if (cardToPlay.value === 'skip' || cardToPlay.value === 'reverse') {
          nextPlayer = 'ai'; // 2 players means skip/reverse goes back to self
        } else if (cardToPlay.value === '+2') {
          const res = drawCard(2, currentDeck);
          newPlayerHand.push(...res.drawn);
          currentDeck = res.remaining;
          nextPlayer = 'ai';
        } else if (cardToPlay.value === '+4') {
          const res = drawCard(4, currentDeck);
          newPlayerHand.push(...res.drawn);
          currentDeck = res.remaining;
          nextPlayer = 'ai';
        }

        setDiscardPile(prev => [...prev, cardToPlay]);
        setAiHand(newAiHand);
        setCurrentColor(nextColor);
        setDeck(currentDeck);
        setPlayerHand(newPlayerHand);
        
        if (!checkWin(newPlayerHand, newAiHand)) {
          setCurrentPlayer(nextPlayer);
        }
      } else {
        // draw
        const res = drawCard(1, deck);
        const drawnCard = res.drawn[0];
        setAiHand(prev => [...prev, ...res.drawn]);
        setDeck(res.remaining);
        
        // if drawn card can be played? keep simple, just end turn
        setCurrentPlayer('player');
      }
    }, 1500);
  }, [aiHand, playerHand, deck, discardPile, currentColor, currentPlayer, winner]);

  useEffect(() => {
    if (currentPlayer === 'ai' && !winner && gameStarted) {
      handleAiTurn();
    }
  }, [currentPlayer, winner, gameStarted, handleAiTurn]);

  const canPlayCard = (card: UnoCard) => {
    if (currentPlayer !== 'player') return false;
    const topCard = discardPile[discardPile.length - 1];
    return card.color === 'wild' || card.color === currentColor || card.value === topCard.value;
  };

  const playCard = (card: UnoCard, selectedColor?: CardColor) => {
    if (!canPlayCard(card)) return;

    if (card.color === 'wild' && !selectedColor) {
      setPendingWildCard(card);
      setShowColorPicker(true);
      return;
    }

    const newPlayerHand = playerHand.filter(c => c.id !== card.id);
    let nextColor = selectedColor || card.color;
    let nextPlayer: 'player'|'ai' = 'ai';
    let currentDeck = deck;
    let newAiHand = [...aiHand];

    if (card.value === 'skip' || card.value === 'reverse') {
      nextPlayer = 'player';
    } else if (card.value === '+2') {
      const res = drawCard(2, currentDeck);
      newAiHand.push(...res.drawn);
      currentDeck = res.remaining;
      nextPlayer = 'player';
    } else if (card.value === '+4') {
      const res = drawCard(4, currentDeck);
      newAiHand.push(...res.drawn);
      currentDeck = res.remaining;
      nextPlayer = 'player';
    }

    setDiscardPile(prev => [...prev, card]);
    setPlayerHand(newPlayerHand);
    setCurrentColor(nextColor);
    setDeck(currentDeck);
    setAiHand(newAiHand);
    setShowColorPicker(false);
    setPendingWildCard(null);

    if (!checkWin(newPlayerHand, newAiHand)) {
      setCurrentPlayer(nextPlayer);
    }
  };

  const handlePlayerDraw = () => {
    if (currentPlayer !== 'player') return;
    const res = drawCard(1, deck);
    setPlayerHand(prev => [...prev, ...res.drawn]);
    setDeck(res.remaining);
    setCurrentPlayer('ai');
  };

  const getColorHex = (color: CardColor) => {
    switch(color) {
      case 'red': return '#FF5252';
      case 'blue': return '#448AFF';
      case 'green': return '#4CAF50';
      case 'yellow': return '#FFC107';
      default: return '#212121';
    }
  };

  const CardComponent = ({ card, hidden = false, onClick, selectable = false }: { card: UnoCard, hidden?: boolean, onClick?: () => void, selectable?: boolean }) => {
    const isWild = card.color === 'wild';
    return (
      <motion.div 
        whileHover={selectable ? { y: -10 } : {}}
        whileTap={selectable ? { scale: 0.95 } : {}}
        onClick={onClick}
        className={`relative w-16 h-24 sm:w-20 sm:h-28 rounded-xl shadow-md flex items-center justify-center border-2 border-white/20 select-none ${selectable ? 'cursor-pointer hover:shadow-lg' : ''}`}
        style={{ 
          backgroundColor: hidden ? '#222' : getColorHex(card.color),
          flexShrink: 0,
          marginLeft: '-1.5rem',
          backgroundImage: hidden ? 'radial-gradient(#444 10%, transparent 11%), radial-gradient(#444 10%, transparent 11%)' : 'none',
          backgroundSize: hidden ? '10px 10px' : 'auto',
          backgroundPosition: hidden ? '0 0, 5px 5px' : '0 0'
        }}
      >
        {!hidden && (
          <div className="absolute inset-1 rounded-lg border-2 border-white/30 flex items-center justify-center bg-white/10">
            {isWild ? (
              <div className="text-white font-bold text-center leading-tight">
                <div className="text-[10px]">WILD</div>
                {card.value === '+4' && <div className="text-xl">+4</div>}
              </div>
            ) : (
              <div className="text-white font-bold text-3xl drop-shadow-md">
                {card.value === 'skip' ? '⊘' : card.value === 'reverse' ? '⟲' : card.value}
              </div>
            )}
            
            <div className="absolute top-1 left-1 text-white text-[10px] font-bold">
              {isWild ? (card.value === '+4' ? '+4' : '★') : (card.value === 'skip' ? '⊘' : card.value === 'reverse' ? '⟲' : card.value)}
            </div>
            <div className="absolute bottom-1 right-1 text-white text-[10px] font-bold rotate-180">
              {isWild ? (card.value === '+4' ? '+4' : '★') : (card.value === 'skip' ? '⊘' : card.value === 'reverse' ? '⟲' : card.value)}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#F5F5F7] overflow-hidden text-[#333]">
      <div className="relative pt-[env(safe-area-inset-top)] z-10 shrink-0 bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="flex justify-between items-center px-4 h-14">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-transform -ml-2">
            <ChevronLeft size={24} className="mr-0.5" />
          </button>
          <div className="text-[17px] font-semibold tracking-wider relative">
             UNO
             <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full opacity-50" style={{ backgroundColor: getColorHex(currentColor) }}></div>
          </div>
          <div className="w-10 h-10"></div>
        </div>
      </div>

      {!gameStarted ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-32 h-48 rounded-2xl bg-[#FF5252] shadow-xl flex items-center justify-center border-4 border-white mb-8 rotate-[-5deg] relative">
            <div className="absolute inset-2 border-2 border-white/50 rounded-xl flex items-center justify-center -rotate-12 bg-white/10">
              <span className="text-white font-black text-4xl italic tracking-tighter">UNO</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">经典 UNO</h2>
          <p className="text-gray-500 text-center mb-8 text-sm max-w-[240px]">
            与 {mjNickname} 进行一场原汁原味的 UNO 对决，先出完牌的一方获胜！
          </p>
          <button 
            onClick={startGame}
            className="w-full max-w-[240px] py-3.5 rounded-full text-white font-semibold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: themeConfig.primaryColor || '#333' }}
          >
            <Play size={18} fill="currentColor" /> 开始游戏
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col relative justify-between pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {/* AI Area */}
          <div className="w-full flex flex-col items-center pt-4">
            <div className="flex items-center gap-2 mb-2 bg-black/5 px-4 py-1.5 rounded-full">
              <Bot size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-600">{mjNickname}</span>
              <span className="text-xs bg-black/10 px-2 py-0.5 rounded text-gray-500">{aiHand.length} 张</span>
            </div>
            <div className="flex justify-center flex-wrap max-w-full px-8" style={{ marginLeft: '1.5rem' }}>
              {aiHand.map((c, i) => (
                <CardComponent key={c.id} card={c} hidden={true} />
              ))}
            </div>
            {currentPlayer === 'ai' && !winner && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs font-medium text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                思考中...
              </motion.div>
            )}
          </div>

          {/* Center Play Area */}
          <div className="flex-1 flex items-center justify-center relative my-4">
            <div className="flex items-center justify-center gap-8">
              {/* Deck */}
              <div 
                className="relative cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                onClick={handlePlayerDraw}
              >
                <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-[#222] shadow-md border-2 border-white/20"
                  style={{
                    backgroundImage: 'radial-gradient(#444 10%, transparent 11%), radial-gradient(#444 10%, transparent 11%)',
                    backgroundSize: '10px 10px',
                    backgroundPosition: '0 0, 5px 5px'
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white/30 font-black text-xl italic -rotate-12">UNO</div>
                </div>
                {deck.length > 0 && (
                  <div className="absolute -top-3 -right-3 bg-white text-black text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow">
                    {deck.length}
                  </div>
                )}
                {currentPlayer === 'player' && !winner && (
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-gray-500 bg-white/50 px-2 py-1 rounded-md backdrop-blur-sm">
                    点击抽牌
                  </div>
                )}
              </div>

              {/* Discard Pile */}
              <div className="relative" style={{ marginLeft: '1.5rem' }}>
                {discardPile.length > 0 ? (
                  <CardComponent card={discardPile[discardPile.length - 1]} />
                ) : (
                  <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-xs">空</div>
                )}
                
                {/* Current Color Indicator */}
                <div 
                  className="absolute -top-4 -right-4 w-8 h-8 rounded-full shadow-md border-2 border-white z-10 flex items-center justify-center text-white"
                  style={{ backgroundColor: getColorHex(currentColor) }}
                >
                  <span className="text-[10px] font-bold">色</span>
                </div>
              </div>
            </div>
          </div>

          {/* Player Area */}
          <div className="w-full flex flex-col items-center">
            {currentPlayer === 'player' && !winner && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2 text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                该你出牌了
              </motion.div>
            )}
            <div className="flex justify-center flex-wrap max-w-full px-8 pb-4" style={{ marginLeft: '1.5rem' }}>
              <AnimatePresence>
                {playerHand.map((c, i) => (
                  <motion.div 
                    key={c.id}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                  >
                    <CardComponent 
                      card={c} 
                      selectable={canPlayCard(c)}
                      onClick={() => playCard(c)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-2 mt-1 bg-black/5 px-4 py-1.5 rounded-full">
              <User size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-600">{myNickname}</span>
            </div>
          </div>

          {/* Color Picker Modal */}
          <AnimatePresence>
            {showColorPicker && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center"
                >
                  <div className="text-base font-bold mb-4 text-gray-800">请选择一种颜色</div>
                  <div className="grid grid-cols-2 gap-4">
                    {COLORS.map(c => (
                      <button 
                        key={c}
                        onClick={() => pendingWildCard && playCard(pendingWildCard, c)}
                        className="w-16 h-16 rounded-xl shadow-md active:scale-95 transition-transform border-2 border-white"
                        style={{ backgroundColor: getColorHex(c) }}
                      />
                    ))}
                  </div>
                  <button 
                    onClick={() => { setShowColorPicker(false); setPendingWildCard(null); }}
                    className="mt-6 text-sm text-gray-400 font-medium py-2 px-4 rounded-full bg-gray-50 active:bg-gray-100"
                  >
                    取消
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Winner Modal */}
          <AnimatePresence>
            {winner && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center max-w-[80%]"
                >
                  <div className="text-5xl mb-4">
                    {winner === 'player' ? '🏆' : '🤡'}
                  </div>
                  <div className="text-xl font-bold mb-2 text-gray-800">
                    {winner === 'player' ? '你赢了！' : `${mjNickname} 赢了！`}
                  </div>
                  <div className="text-sm text-gray-500 mb-8 text-center">
                    {winner === 'player' ? '太棒了，你出完了所有的牌！' : '下次再接再厉吧~'}
                  </div>
                  <button 
                    onClick={() => { setWinner(null); setGameStarted(false); }}
                    className="w-full py-3 rounded-full text-white font-semibold shadow-md active:scale-95 transition-all"
                    style={{ backgroundColor: themeConfig.primaryColor || '#333' }}
                  >
                    返回游戏中心
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
