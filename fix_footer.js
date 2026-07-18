import fs from 'fs';

let content = fs.readFileSync('src/components/Footer.tsx', 'utf-8');

const regex = /\{showSupportModal && \([\s\S]*?\)\}/g;
content = content.replace(regex, '');

// Also remove the "Dukung Proyek Ini" button from Footer
const buttonRegex = /<button[\s\S]*?onClick=\{\(\) => setShowSupportModal\(true\)\}[\s\S]*?<\/button>/g;
content = content.replace(buttonRegex, '');

// Clean up unused imports if any
content = content.replace("import { useState } from 'react';", "");
content = content.replace("import { Instagram, Mail, Heart, X, ExternalLink } from 'lucide-react';", "import { Instagram, Mail } from 'lucide-react';");
content = content.replace("const [showSupportModal, setShowSupportModal] = useState(false);", "");

// Ensure no empty fragment brackets
content = content.replace("<>\n      <footer", "<footer");
content = content.replace("</footer>\n\n      \n    </>", "</footer>");

fs.writeFileSync('src/components/Footer.tsx', content);
