import fs from 'fs';

const content = `export function generateBatchDXF(batchList: any[]): string {
  let dxf = "  0\\nSECTION\\n  2\\nENTITIES\\n";

  batchList.forEach(item => {
    if (item.isValid && item.utmX !== null && item.utmY !== null) {
      const x = item.utmX.toFixed(4);
      const y = item.utmY.toFixed(4);
      const name = item.name || 'Point';
      
      // Add Point
      dxf += "  0\\nPOINT\\n  8\\nPOINTS\\n 10\\n" + x + "\\n 20\\n" + y + "\\n 30\\n0.0\\n";
      
      // Add Text
      dxf += "  0\\nTEXT\\n  8\\nLABELS\\n 10\\n" + x + "\\n 20\\n" + y + "\\n 30\\n0.0\\n 40\\n1.0\\n  1\\n" + name + "\\n";
    }
  });

  dxf += "  0\\nENDSEC\\n  0\\nEOF\\n";

  return dxf;
}
`;

fs.writeFileSync('src/utils/dxfGenerator.ts', content);
