const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

function replaceSizes(str) {
  return str.replace(/text-\[(\d+)px\]/g, (match, size) => {
    let s = parseInt(size, 10);
    if (s >= 13 && s <= 17) {
      return `text-[${s - 2}px]`; // Making them 2px smaller to be noticeable. 17 -> 15.
    }
    return match;
  });
}

const splitPoint = content.indexOf("if (view === 'data') {");
if (splitPoint > -1) {
  const part1 = content.slice(0, splitPoint);
  let part2 = content.slice(splitPoint);
  
  const settingItemIndex = part1.indexOf('const SettingItem =');
  const part1_1 = part1.slice(0, settingItemIndex);
  let part1_2 = part1.slice(settingItemIndex);
  part1_2 = replaceSizes(part1_2);
  
  let homeMatch = part2.indexOf("  return (\n    <div className=\"fixed inset-0");
  if (homeMatch === -1) { homeMatch = part2.indexOf("  return (\n    <div "); }
  
  if (homeMatch > -1) {
       let viewsPart = part2.slice(0, homeMatch);
       let homePart = part2.slice(homeMatch);
       viewsPart = replaceSizes(viewsPart);
       
       content = part1_1 + part1_2 + viewsPart + homePart;
       fs.writeFileSync('src/App.tsx', content);
       console.log('Fonts resized.');
  } else {
       console.log('Home return not found');
  }
} else {
  console.log('data view not found');
}
