export interface QRPaymentData {
  type: 'UPI' | 'PIX' | 'ALIPAY' | 'PAYNOW' | 'ZELLE' | 'VENMO' | 'MPESA' | 'SEPA' | 'UNKNOWN';
  country: string;
  recipient: string;
  amount?: number;
  currency: string;
  reference?: string;
  merchantName?: string;
  description?: string;
}

export class QRParser {
  static parseQRCode(data: string): QRPaymentData {
    // UPI (India) - Format: upi://pay?pa=...&pn=...&am=...
    if (data.includes('upi://pay') || data.includes('pa=')) {
      return this.parseUPI(data);
    }

    // PIX (Brazil) - Format: 00020126...
    if (data.includes('pix.bcb.gov.br') || data.match(/^00020126/)) {
      return this.parsePIX(data);
    }

    // PayNow (Singapore) - Format: SGQR or paynow
    if (data.includes('SGQR') || data.includes('paynow')) {
      return this.parsePayNow(data);
    }

    // Alipay (China) - Format: https://qr.alipay.com/...
    if (data.includes('alipay') || data.includes('ALIPAY')) {
      return this.parseAlipay(data);
    }

    // Zelle (USA) - Format: zelle://...
    if (data.includes('zelle://') || data.includes('zellepay')) {
      return this.parseZelle(data);
    }

    // Venmo (USA) - Format: venmo://...
    if (data.includes('venmo://') || data.includes('venmo.com')) {
      return this.parseVenmo(data);
    }

    // M-Pesa (Africa) - Format: mpesa://...
    if (data.includes('mpesa://') || data.includes('safaricom')) {
      return this.parseMPesa(data);
    }

    // SEPA (Europe) - Format: BCD...
    if (data.startsWith('BCD') || data.includes('SEPA')) {
      return this.parseSEPA(data);
    }

    return {
      type: 'UNKNOWN',
      country: 'Unknown',
      recipient: 'Unknown',
      currency: 'USD',
    };
  }

  private static parseUPI(data: string): QRPaymentData {
    const params = new URLSearchParams(data.split('?')[1] || '');
    const recipient = params.get('pa') || 'Unknown';
    const merchantName = params.get('pn') || undefined;
    const amount = params.get('am') ? parseFloat(params.get('am')!) : undefined;
    const reference = params.get('tr') || undefined;

    return {
      type: 'UPI',
      country: 'India',
      recipient,
      amount,
      currency: 'INR',
      reference,
      merchantName,
    };
  }

  private static parsePIX(data: string): QRPaymentData {
    // PIX QR codes are complex EMV format
    // This is a simplified parser
    return {
      type: 'PIX',
      country: 'Brazil',
      recipient: 'PIX Account',
      currency: 'BRL',
    };
  }

  private static parsePayNow(data: string): QRPaymentData {
    return {
      type: 'PAYNOW',
      country: 'Singapore',
      recipient: 'PayNow Account',
      currency: 'SGD',
    };
  }

  private static parseAlipay(data: string): QRPaymentData {
    return {
      type: 'ALIPAY',
      country: 'China',
      recipient: 'Alipay Account',
      currency: 'CNY',
    };
  }

  private static parseZelle(data: string): QRPaymentData {
    return {
      type: 'ZELLE',
      country: 'United States',
      recipient: 'Zelle Account',
      currency: 'USD',
    };
  }

  private static parseVenmo(data: string): QRPaymentData {
    return {
      type: 'VENMO',
      country: 'United States',
      recipient: 'Venmo Account',
      currency: 'USD',
    };
  }

  private static parseMPesa(data: string): QRPaymentData {
    return {
      type: 'MPESA',
      country: 'Kenya',
      recipient: 'M-Pesa Account',
      currency: 'KES',
    };
  }

  private static parseSEPA(data: string): QRPaymentData {
    // SEPA QR codes follow EPC QR Code standard
    const lines = data.split('\n');
    const recipient = lines[5] || 'SEPA Account';
    const amount = lines[4] ? parseFloat(lines[4]) : undefined;

    return {
      type: 'SEPA',
      country: 'Europe',
      recipient,
      amount,
      currency: 'EUR',
    };
  }
}