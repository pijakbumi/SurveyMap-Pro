import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `<span className="font-extrabold text-[#1B3F79] shrink-0 mt-0.5 w-8">Pt {idx + 1}</span>`;
const replaceStr = `<span className="font-extrabold text-[#1B3F79] shrink-0 mt-0.5 w-10">Pt {idx + 1}</span>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Success");
} else {
  console.log("Not found");
}

