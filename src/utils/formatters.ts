// Formatting and vector barcode/QR generator for SPEED Clinic Management System (ETB / Ethiopian Birr)

export function formatCurrency(amount: number, currency: string = 'ETB'): string {
  const cleanCurrency = (!currency || currency === '$' || currency === 'USD') ? 'ETB' : currency;
  return `${cleanCurrency} ${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatTimeOnly(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatDateOnly(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export type ExpiryStatus = 'expired' | 'expiring_soon' | 'safe';

export function getBatchExpiryStatus(expiryDateStr: string, warningDays: number = 60): {
  status: ExpiryStatus;
  daysRemaining: number;
  label: string;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expDate = new Date(expiryDateStr);
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    return {
      status: 'expired',
      daysRemaining,
      label: `EXPIRED (${Math.abs(daysRemaining)}d ago)`,
    };
  }

  if (daysRemaining <= warningDays) {
    return {
      status: 'expiring_soon',
      daysRemaining,
      label: `Expiring Soon (${daysRemaining}d)`,
    };
  }

  return {
    status: 'safe',
    daysRemaining,
    label: `Safe (${daysRemaining}d)`,
  };
}

// Generate simple SVG Barcode pattern
export function generateBarcodeSvg(data: string, width: number = 240, height: number = 50): string {
  // Deterministic pseudo-code barcode generation based on string characters
  let bars: { x: number; w: number }[] = [];
  let currentX = 10;
  const hash = data.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Start quiet zone & guard
  bars.push({ x: currentX, w: 2 });
  currentX += 4;
  bars.push({ x: currentX, w: 2 });
  currentX += 4;

  for (let i = 0; i < data.length; i++) {
    const code = data.charCodeAt(i);
    const pattern = [(code % 3) + 1, ((code >> 1) % 3) + 1, ((code >> 2) % 2) + 1];
    for (let p of pattern) {
      bars.push({ x: currentX, w: p * 1.5 });
      currentX += p * 1.5 + 2.5;
    }
  }

  // End guard
  bars.push({ x: currentX, w: 2 });
  currentX += 4;
  bars.push({ x: currentX, w: 2 });
  currentX += 10;

  const totalWidth = Math.max(currentX, width);

  return `
    <svg viewBox="0 0 ${totalWidth} ${height}" xmlns="http://www.w3.org/2000/svg" class="w-full h-auto">
      <rect width="${totalWidth}" height="${height}" fill="#ffffff"/>
      ${bars.map(b => `<rect x="${b.x}" y="5" width="${b.w}" height="${height - 20}" fill="#111827"/>`).join('')}
      <text x="${totalWidth / 2}" y="${height - 4}" font-family="monospace" font-size="10" text-anchor="middle" fill="#374151" letter-spacing="2">${data}</text>
    </svg>
  `;
}

// Generate pseudo 2D QR Code Matrix SVG
export function generateQrMatrixSvg(data: string, size: number = 100): string {
  const gridSize = 21;
  const cellSize = size / gridSize;

  // Simple deterministic 21x21 QR pattern generator
  const matrix: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  // Finder patterns at top-left, top-right, bottom-left
  const addFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  };

  addFinder(0, 0);
  addFinder(gridSize - 7, 0);
  addFinder(0, gridSize - 7);

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    if (i % 2 === 0) {
      matrix[6][i] = true;
      matrix[i][6] = true;
    }
  }

  // Seed inner bits based on string
  let charIdx = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Don't overwrite finder patterns
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= gridSize - 8) ||
        (r >= gridSize - 8 && c < 8) ||
        r === 6 || c === 6
      ) {
        continue;
      }
      const charVal = data.charCodeAt(charIdx % data.length);
      const isBit = ((charVal * (r + 1) * (c + 3)) + r * c) % 7 < 3;
      matrix[r][c] = isBit;
      charIdx++;
    }
  }

  let rects = '';
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (matrix[r][c]) {
        rects += `<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#0f172a" />`;
      }
    }
  }

  return `
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#ffffff" />
      ${rects}
    </svg>
  `;
}

// ESC/POS Thermal Printing Command Generator (Raw Bytes & Hex Dump)
export interface EscPosJob {
  jobId: string;
  stationId: string;
  documentType: string;
  widthMm: 80 | 58;
  rawText: string;
  hexDump: string;
  commandBreakdown: string[];
  paperCut: boolean;
  drawerKick: boolean;
}

export function generateEscPosReceiptJob(
  clinicName: string,
  receiptNumber: string,
  patientName: string,
  items: { name: string; amount: number }[],
  totalAmount: number,
  currency: string = 'ETB',
  cashierName: string,
  widthMm: 80 | 58 = 80
): EscPosJob {
  const lineCols = widthMm === 80 ? 48 : 32;
  const divider = '-'.repeat(lineCols);
  const doubleDivider = '='.repeat(lineCols);

  const rawLines: string[] = [];
  const commands: string[] = [];

  // 1. Initialize Printer [ESC @]
  commands.push('ESC @ (Initialize printer hardware)');

  // 2. Open Cash Drawer [ESC p 0 25 250]
  commands.push('ESC p 0 25 250 (Kick cash drawer pin 2)');

  // 3. Center align + Double height bold [ESC a 1, ESC ! 32]
  commands.push('ESC a 1 (Align Center)');
  commands.push('ESC ! 32 (Double-height bold header)');
  rawLines.push(clinicName.toUpperCase());
  rawLines.push('SPEED CLINIC MANAGEMENT SYSTEM');
  rawLines.push('OFFICIAL CASH RECEIPT');
  rawLines.push(doubleDivider);

  // 4. Left align + normal font [ESC a 0, ESC ! 0]
  commands.push('ESC a 0 (Align Left)');
  commands.push('ESC ! 0 (Normal 12x24 font)');
  rawLines.push(`Receipt #: ${receiptNumber}`);
  rawLines.push(`Date:      ${new Date().toLocaleString('en-US')}`);
  rawLines.push(`Patient:   ${patientName}`);
  rawLines.push(`Cashier:   ${cashierName}`);
  rawLines.push(divider);

  // 5. Line items
  items.forEach((item) => {
    const amtStr = `${currency} ${item.amount.toFixed(2)}`;
    const nameMax = lineCols - amtStr.length - 1;
    const nameTrunc = item.name.length > nameMax ? item.name.substring(0, nameMax - 1) + '.' : item.name;
    const spaces = ' '.repeat(Math.max(1, lineCols - nameTrunc.length - amtStr.length));
    rawLines.push(`${nameTrunc}${spaces}${amtStr}`);
  });

  rawLines.push(divider);

  // 6. Total in Bold
  commands.push('ESC ! 16 (Double-width bold total)');
  const totalStr = `TOTAL: ${currency} ${totalAmount.toFixed(2)}`;
  const totalSpaces = ' '.repeat(Math.max(1, lineCols - totalStr.length));
  rawLines.push(`${totalSpaces}${totalStr}`);
  rawLines.push(doubleDivider);

  // 7. QR / Barcode indicator
  commands.push(`GS k 73 ${receiptNumber.length} (Code128 Barcode: ${receiptNumber})`);
  rawLines.push(`* BARCODE [${receiptNumber}] *`);
  rawLines.push('Thank you for choosing SPEED Clinic.');
  rawLines.push('Please present this receipt at consultation/pharmacy.');

  // 8. Feed 4 lines and Partial Cut [ESC d 4, GS V 1]
  commands.push('ESC d 4 (Feed 4 lines)');
  commands.push('GS V 66 0 (Full paper cut)');

  const rawText = rawLines.join('\n');

  // Convert to formatted hex dump
  let hexDump = '';
  for (let i = 0; i < rawText.length; i++) {
    const code = rawText.charCodeAt(i).toString(16).padStart(2, '0').toUpperCase();
    hexDump += code + (i % 16 === 15 ? '\n' : ' ');
  }

  return {
    jobId: `PRINT-${Date.now()}`,
    stationId: 'CURRENT-WS',
    documentType: 'Official Receipt',
    widthMm,
    rawText,
    hexDump,
    commandBreakdown: commands,
    paperCut: true,
    drawerKick: true,
  };
}
