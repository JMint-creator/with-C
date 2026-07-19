import re

with open('src/BalatroGameView.tsx', 'r') as f:
    content = f.read()

old_rounds = """const ROUNDS = [
  { level: 1, name: '小盲注', targetScore: 1000, description: '练手关卡', bossEffect: null },
  { level: 2, name: '大盲注', targetScore: 2500, description: '渐入佳境', bossEffect: null },
  { level: 3, name: 'Boss盲注 - 坚石', targetScore: 5000, description: '超高目标分数，且基础分数减半！', bossEffect: '坚石' }
];"""

new_rounds = """const BOSSES = [
  { name: 'Boss盲注 - 坚石', targetScore: 5000, description: '基础分数与倍率减半', bossEffect: '坚石' },
  { name: 'Boss盲注 - 高墙', targetScore: 10000, description: '极高的目标分数', bossEffect: '高墙' },
  { name: 'Boss盲注 - 针刺', targetScore: 2500, description: '只有 1 次出牌机会', bossEffect: '针刺' },
  { name: 'Boss盲注 - 灵媒', targetScore: 5000, description: '每次必须打出恰好 5 张牌', bossEffect: '灵媒' },
  { name: 'Boss盲注 - 窗户', targetScore: 5000, description: '所有方块(♦)牌不计分', bossEffect: '窗户' }
];

const DEFAULT_ROUNDS = [
  { level: 1, name: '小盲注', targetScore: 1000, description: '练手关卡', bossEffect: null },
  { level: 2, name: '大盲注', targetScore: 2500, description: '渐入佳境', bossEffect: null }
];"""

content = content.replace(old_rounds, new_rounds)

old_state = """  const [mjNickname] = useLocalState('app_mjNickname', '梦角');
  
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'round_won' | 'shop' | 'game_won' | 'lost'>('intro');"""

new_state = """  const [mjNickname] = useLocalState('app_mjNickname', '梦角');
  
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'round_won' | 'shop' | 'game_won' | 'lost'>('intro');
  const [rounds, setRounds] = useState<any[]>([
    ...DEFAULT_ROUNDS,
    { level: 3, name: 'Boss盲注 - 坚石', targetScore: 5000, description: '基础分数与倍率减半', bossEffect: '坚石' }
  ]);"""

content = content.replace(old_state, new_state)

old_current_round = """  const currentRound = ROUNDS[currentRoundIndex];"""
new_current_round = """  const currentRound = rounds[currentRoundIndex];"""
content = content.replace(old_current_round, new_current_round)

old_start_round = """  const startRound = (index: number) => {
    let initialDeck = generateDeck();
    let initialState = { handsLeft: 4, discardsLeft: 4, maxSelect: 5, baseChipsBonus: 0, globalMult: 1 };
    
    activeBuffs.forEach(b => {
      initialState = b.apply(initialState);
    });

    setDeck(initialDeck);
    setHand(drawCards(initialDeck, 8));
    setScore(0);
    setHandsLeft(initialState.handsLeft);
    setDiscardsLeft(initialState.discardsLeft);
    setSelectedIds(new Set());
    setLastPlayInfo(null);
  };"""

new_start_round = """  const startRound = (index: number, currentRounds: any[] = rounds) => {
    let initialDeck = generateDeck();
    let initialState = { handsLeft: 4, discardsLeft: 4, maxSelect: 5, baseChipsBonus: 0, globalMult: 1 };
    
    activeBuffs.forEach(b => {
      initialState = b.apply(initialState);
    });
    
    if (currentRounds[index]?.bossEffect === '针刺') {
      initialState.handsLeft = 1;
    }

    setDeck(initialDeck);
    setHand(drawCards(initialDeck, 8));
    setScore(0);
    setHandsLeft(initialState.handsLeft);
    setDiscardsLeft(initialState.discardsLeft);
    setSelectedIds(new Set());
    setLastPlayInfo(null);
  };"""

content = content.replace(old_start_round, new_start_round)

old_start_game = """  const startNewGame = () => {
    setDeck(generateDeck());
    setActiveBuffs([]);
    setCurrentRoundIndex(0);
    setGameState('playing');
    setMoney(20);
    startRound(0);
  };"""

new_start_game = """  const startNewGame = () => {
    const randomBoss = BOSSES[Math.floor(Math.random() * BOSSES.length)];
    const newRounds = [
      ...DEFAULT_ROUNDS,
      { level: 3, ...randomBoss }
    ];
    setRounds(newRounds);
    
    setDeck(generateDeck());
    setActiveBuffs([]);
    setCurrentRoundIndex(0);
    setGameState('playing');
    setMoney(20);
    startRound(0, newRounds);
  };"""

content = content.replace(old_start_game, new_start_game)


old_card_chips = """    const cardChips = selectedCards.reduce((acc, c) => acc + c.value, 0);"""
new_card_chips = """    const cardChips = selectedCards.reduce((acc, c) => {
      if (currentRound.bossEffect === '窗户' && c.suit === '♦') return acc;
      return acc + c.value;
    }, 0);"""

content = content.replace(old_card_chips, new_card_chips)

old_eval_scoring = """    const evalResult = evaluateHand(selectedCards, allBuffs);"""
new_eval_scoring = """    const evalResult = evaluateHand(selectedCards, allBuffs);
    if (currentRound.bossEffect === '窗户') {
      evalResult.scoringCards = evalResult.scoringCards.filter(c => c.suit !== '♦');
    }"""
content = content.replace(old_eval_scoring, new_eval_scoring)

old_boss_effect = """    // Boss effect
    if (currentRound.bossEffect === '坚石') {
        totalChips = Math.max(1, Math.floor(totalChips / 2));
    }"""

new_boss_effect = """    // Boss effect
    if (currentRound.bossEffect === '坚石') {
        totalChips = Math.max(1, Math.floor(totalChips / 2));
        totalMult = Math.max(1, Math.floor(totalMult / 2));
    }"""
content = content.replace(old_boss_effect, new_boss_effect)

old_rounds_len_1 = """if (currentRoundIndex === ROUNDS.length - 1) {"""
new_rounds_len_1 = """if (currentRoundIndex === rounds.length - 1) {"""
content = content.replace(old_rounds_len_1, new_rounds_len_1)


old_boss_ui = """          {/* Boss Effect Display */}
          {currentRound.bossEffect && (
            <div className="mx-4 mt-2 bg-red-500/20 border border-red-500/30 rounded-xl p-3 flex items-center gap-3 shadow-lg">
              <div className="flex-1">
                <div className="text-[12px] text-red-300/80 mb-0.5">⚠️ 盲注效果激活</div>
                <div className="text-[13px] font-bold text-red-200">{currentRound.bossEffect}: 基础分数减半！</div>
              </div>
            </div>
          )}"""
          
new_boss_ui = """"""
content = content.replace(old_boss_ui, new_boss_ui)

old_top_bar = """          {/* Top Bar Stats */}
          <div className="flex px-4 py-3 gap-3 bg-white/5 border-b border-white/5">
            <div className="flex-1 bg-white/10 rounded-xl p-2.5 flex flex-col justify-center">
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
          </div>"""
          
new_top_bar = """          {/* Top Bar Stats */}
          <div className="flex flex-col px-4 py-3 gap-2 bg-white/5 border-b border-white/5">
            <div className="flex gap-3">
              <div className="flex-1 bg-white/10 rounded-xl p-2.5 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-white/50 text-[11px] font-bold uppercase tracking-wider">分数</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${currentRound.bossEffect ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70'}`}>
                    {currentRoundIndex + 1}/{rounds.length} {currentRound.name}
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
            
            {/* Boss Effect Mini Banner */}
            {currentRound.bossEffect && (
              <div className="w-full bg-red-500/20 border border-red-500/30 rounded-lg px-2 py-1 flex items-center justify-center gap-1.5 shadow-inner">
                 <AlertTriangle size={12} className="text-red-400 shrink-0" />
                 <span className="text-[11px] font-bold text-red-300">
                    ⚠️ {currentRound.bossEffect}: {currentRound.description}
                 </span>
              </div>
            )}
          </div>"""

content = content.replace(old_top_bar, new_top_bar)

old_play_btn = """              <button 
                onClick={handlePlay}
                disabled={selectedIds.size === 0 || handsLeft <= 0}
                className="flex-1 py-3.5 rounded-xl font-bold text-slate-900 transition-all disabled:opacity-30 bg-[#F57F17] active:bg-[#F9A825]"
              >
                出牌
              </button>"""
              
new_play_btn = """              <button 
                onClick={handlePlay}
                disabled={selectedIds.size === 0 || handsLeft <= 0 || (currentRound.bossEffect === '灵媒' && selectedIds.size !== 5)}
                className="flex-1 py-3.5 rounded-xl font-bold text-slate-900 transition-all disabled:opacity-30 bg-[#F57F17] active:bg-[#F9A825]"
              >
                {currentRound.bossEffect === '灵媒' && selectedIds.size !== 5 ? '需要 5 张牌' : '出牌'}
              </button>"""
              
content = content.replace(old_play_btn, new_play_btn)


with open('src/BalatroGameView.tsx', 'w') as f:
    f.write(content)
