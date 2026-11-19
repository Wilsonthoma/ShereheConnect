import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

@Injectable()
export class DarajaService {
  private readonly logger = new Logger(DarajaService.name);
  private cachedToken: { token: string; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    const env = this.config.get<string>('MPESA_ENVIRONMENT', 'sandbox');
    return env === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';
  }

  formatMsisdn(phone: string): string {
    const cleaned = phone.replace(/[\s+-]/g, '');
    if (cleaned.startsWith('0')) {
      return `254${cleaned.slice(1)}`;
    }
    if (cleaned.startsWith('254')) {
      return cleaned;
    }
    return `254${cleaned}`;
  }

  private getTimestamp(): string {
    const now = new Date();
    const eat = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${eat.getUTCFullYear()}` +
      `${pad(eat.getUTCMonth() + 1)}` +
      `${pad(eat.getUTCDate())}` +
      `${pad(eat.getUTCHours())}` +
      `${pad(eat.getUTCMinutes())}` +
      `${pad(eat.getUTCSeconds())}`
    );
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.cachedToken.expiresAt) {
      return this.cachedToken.token;
    }

    const consumerKey = this.config.getOrThrow<string>('MPESA_CONSUMER_KEY');
    const consumerSecret = this.config.getOrThrow<string>('MPESA_CONSUMER_SECRET');
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const res = await fetch(
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: 'GET',
        headers: { Authorization: `Basic ${auth}` },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Daraja OAuth failed: ${res.status} ${text}`);
      throw new InternalServerErrorException('Failed to authenticate with M-Pesa gateway.');
    }

    const data = (await res.json()) as { access_token: string; expires_in: string };
    const expiresInSec = parseInt(data.expires_in || '3599', 10);

    this.cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (expiresInSec - 60) * 1000,
    };

    return data.access_token;
  }

  async initiateStkPush(params: {
    phoneNumber: string;
    amountKes: number;
    accountReference: string;
    transactionDesc: string;
  }): Promise<StkPushResponse> {
    const token = await this.getAccessToken();
    const shortCode = this.config.getOrThrow<string>('MPESA_SHORTCODE');
    const passkey = this.config.getOrThrow<string>('MPESA_PASSKEY');
    const callbackUrl = this.config.getOrThrow<string>('MPESA_CALLBACK_URL');

    const timestamp = this.getTimestamp();
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
    const msisdn = this.formatMsisdn(params.phoneNumber);

    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(params.amountKes),
      PartyA: msisdn,
      PartyB: shortCode,
      PhoneNumber: msisdn,
      CallBackURL: callbackUrl,
      AccountReference: params.accountReference.slice(0, 12),
      TransactionDesc: params.transactionDesc.slice(0, 13),
    };

    const res = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || data.ResponseCode !== '0') {
      this.logger.error(`STK Push rejected: ${JSON.stringify(data)}`);
      throw new InternalServerErrorException(
        data.errorMessage || data.ResponseDescription || 'M-Pesa STK Push initiation failed.',
      );
    }

    return data as StkPushResponse;
  }
}