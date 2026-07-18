export function generateBatchDXF(batchList: any[], crs: 'UTM' | 'TM3' = 'UTM'): string {
  let dxf = "  0\nSECTION\n  2\nENTITIES\n";

  batchList.forEach(item => {
    let xStr = "";
    let yStr = "";
    let valid = false;

    if (crs === 'UTM' && item.isValid && item.utmX !== null && item.utmY !== null) {
      xStr = item.utmX.toFixed(4);
      yStr = item.utmY.toFixed(4);
      valid = true;
    } else if (crs === 'TM3' && item.isValid && item.tm3X !== null && item.tm3Y !== null) {
      xStr = item.tm3X.toFixed(4);
      yStr = item.tm3Y.toFixed(4);
      valid = true;
    }

    if (valid) {
      const name = item.name || 'Point';
      
      // Add Point
      dxf += "  0\nPOINT\n  8\nPOINTS\n 10\n" + xStr + "\n 20\n" + yStr + "\n 30\n0.0\n";
      
      // Add Text
      dxf += "  0\nTEXT\n  8\nLABELS\n 10\n" + xStr + "\n 20\n" + yStr + "\n 30\n0.0\n 40\n1.0\n  1\n" + name + "\n";
    }
  });

  dxf += "  0\nENDSEC\n  0\nEOF\n";

  return dxf;
}
