import re

with open('src/BalatroGameView.tsx', 'r') as f:
    content = f.read()

old_bosses = """const BOSSES = [
  { name: 'Boss盲注 - 坚石', targetScore: 5000, description: '基础分数与倍率减半', bossEffect: '坚石' },"""
new_bosses = """const BOSSES = [
  { name: 'Boss盲注 - 坚石', targetScore: 2500, description: '基础分数与倍率减半', bossEffect: '坚石' },"""
content = content.replace(old_bosses, new_bosses)

old_state = """  const [rounds, setRounds] = useState<any[]>([
    ...DEFAULT_ROUNDS,
    { level: 3, name: 'Boss盲注 - 坚石', targetScore: 5000, description: '基础分数与倍率减半', bossEffect: '坚石' }
  ]);"""
new_state = """  const [rounds, setRounds] = useState<any[]>(() => {
    const randomBoss = BOSSES[Math.floor(Math.random() * BOSSES.length)];
    return [
      ...DEFAULT_ROUNDS,
      { level: 3, ...randomBoss }
    ];
  });"""
content = content.replace(old_state, new_state)

with open('src/BalatroGameView.tsx', 'w') as f:
    f.write(content)

