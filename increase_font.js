import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `<div key={idx} className="flex items-center justify-between text-[10px] bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-100 font-mono">
                                  <div className="flex items-start gap-2">
                                    <span className="font-extrabold text-[#1B3F79] shrink-0 mt-0.5 w-10">Pt {idx + 1}</span>
                                    <div className="flex flex-col">
                                      <span className="text-slate-800 font-black whitespace-normal break-all sm:break-normal">
                                        {displayText}
                                      </span>`;

const replaceStr = `<div key={idx} className="flex items-center justify-between text-xs bg-slate-50 hover:bg-slate-100 p-2 rounded-lg border border-slate-100 font-mono">
                                  <div className="flex items-start gap-2">
                                    <span className="font-extrabold text-[#1B3F79] shrink-0 mt-0.5 w-10 text-[11px]">Pt {idx + 1}</span>
                                    <div className="flex flex-col">
                                      <span className="text-slate-800 font-black whitespace-normal break-all sm:break-normal text-[11px]">
                                        {displayText}
                                      </span>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replaceStr);
  fs.writeFileSync('src/App.tsx', content);
  console.log("Success");
} else {
  console.log("Not found");
}
