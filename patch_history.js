const fs = require('fs');
const content = fs.readFileSync('src/components/CoordinateHistory.tsx', 'utf-8');

const helper = `const formatTimeWithZone = (dateString: string) => {
  const date = new Date(dateString);
  const timeString = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tzParts = new Intl.DateTimeFormat('id-ID', { timeZoneName: 'short' }).formatToParts(date);
  const tzString = tzParts.find(p => p.type === 'timeZoneName')?.value || '';
  return \`\${timeString} \${tzString}\`;
};`;

// insert helper after "const getTypeBadge = (type: string) => {"
const insertIdx = content.indexOf('const getTypeBadge =');
let newContent = content.slice(0, insertIdx) + helper + '\n\n  ' + content.slice(insertIdx);

// replace the timestamp display
newContent = newContent.replace(
  "{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}",
  "{formatTimeWithZone(item.timestamp)}"
);

fs.writeFileSync('src/components/CoordinateHistory.tsx', newContent);
