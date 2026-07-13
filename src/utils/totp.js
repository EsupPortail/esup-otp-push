import {TOTP} from 'totp-generator';
import Crypto from 'react-native-quick-crypto';
import base64 from 'react-native-base64'
import { Alert } from 'react-native';

const DEFAULT_OPTIONS = {
  digits: 6,
  algorithm: 'SHA-1',
  period: 30,
};

const ALGORITHMS = {
  SHA1: 'SHA-1',
  'SHA-1': 'SHA-1',
  SHA224: 'SHA-224',
  'SHA-224': 'SHA-224',
  SHA256: 'SHA-256',
  'SHA-256': 'SHA-256',
  SHA384: 'SHA-384',
  'SHA-384': 'SHA-384',
  SHA512: 'SHA-512',
  'SHA-512': 'SHA-512',
};

const normalizeAlgorithm = algorithm => {
  if (!algorithm) return DEFAULT_OPTIONS.algorithm;
  const key = String(algorithm).trim().toUpperCase();
  return ALGORITHMS[key] || DEFAULT_OPTIONS.algorithm;
};

const normalizeInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeSecret = secret => String(secret || '').replace(/\s/g, '').toUpperCase();

export const Totp = {
  getOptions: entry => {
    if (!entry || typeof entry !== 'object') {
      return DEFAULT_OPTIONS;
    }

    return {
      digits: normalizeInteger(entry.digits, DEFAULT_OPTIONS.digits),
      algorithm: normalizeAlgorithm(entry.algorithm),
      period: normalizeInteger(entry.period, DEFAULT_OPTIONS.period),
    };
  },
  getName: entry => {
    if (!entry || typeof entry !== 'object') {
      return entry;
    }

    return entry.name || entry.issuer || 'TOTP';
  },
  buildEntry: parsed => ({
    name: parsed.name,
    issuer: parsed.issuer || '',
    algorithm: normalizeAlgorithm(parsed.algorithm),
    digits: normalizeInteger(parsed.digits, DEFAULT_OPTIONS.digits),
    period: normalizeInteger(parsed.period, DEFAULT_OPTIONS.period),
  }),
  token: (secret, options) => {
    try {
      const {otp} = TOTP.generate(normalizeSecret(secret), Totp.getOptions(options));
      return otp;
    } catch (error) {
      console.error('Erreur lors de la génération du TOTP:', error);
      return null;
    }
  },
  isValid: (token, secret, options) => {
    try {
      const {otp} = TOTP.generate(normalizeSecret(secret), Totp.getOptions(options));
      return token === otp;
    } catch (error) {
      console.error('Erreur lors de la validation du TOTP:', error);
      return false;
    }
  },
  formatCode: code => {
    if (!code) return 'N/A';
    return code.replace(/(\d{3})(\d{3})/, '$1 $2'); // Formater le code TOTP (ex. "123456" → "123 456")
  },
  parseTotpUrl: url => {
    try {
      // Vérifier si c'est une URL TOTP
      if (!url.startsWith('otpauth://totp/')) {
        throw new Error('URL non TOTP');
      }

      const parsedUrl = new URL(url);
      const path = url.split('?')[0];
      let secret = parsedUrl.searchParams.get('secret') || '';

      if (!secret) {
        throw new Error('Secret manquant');
      }

      // Normaliser en majuscules pour la validation Base32
      secret = normalizeSecret(secret);

      // Valider Base32
      if (!/^[A-Z2-7]+=*$/.test(secret)) {
        throw new Error('Secret invalide (pas Base32)');
      }

      // Extraire name
      let name = path.replace('otpauth://totp/', '');
      name = decodeURIComponent(name.replace(/\/+/g, '')); // Supprime les /
      if (!name) {
        throw new Error('Nom manquant');
      }

      const issuer = parsedUrl.searchParams.get('issuer') || '';

      return {
        secret,
        name,
        issuer,
        algorithm: normalizeAlgorithm(parsedUrl.searchParams.get('algorithm')),
        digits: normalizeInteger(parsedUrl.searchParams.get('digits'), DEFAULT_OPTIONS.digits),
        period: normalizeInteger(parsedUrl.searchParams.get('period'), DEFAULT_OPTIONS.period),
      };
    } catch (error) {
      console.error('Erreur de parsing:', error);
      Alert.alert('Erreur', 'QR code invalide pour TOTP.');
      return null;
    }
  },
  hashTotpSecret: (base32Secret, uid) => {
    if (!base32Secret || !uid) return null;
    const subStr = base32Secret.substring(0, 20);
    const toHash = subStr + uid;

    try {
      // SHA-256
      const hashBuffer = Crypto.createHash('sha256')
        .update(toHash)
        .digest(); // retourne Uint8Array ou Buffer

      // Convertir le buffer en chaîne binaire (string) compatible pour base64
      const binaryString = String.fromCharCode(...new Uint8Array(hashBuffer));

      // Encoder en Base64
      const b64 = base64.encode(binaryString);

      // Transformer en Base64URL (remplacer +, / et supprimer = à la fin)
      const base64url = b64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      return base64url;
    } catch (error) {
      console.error('[hashTotpSecret] Erreur durant le hachage ou l’encodage :', error);
      return null;
    }
  },
  hasMatchingTotp: (totpObjects, uid, serverHash) => {
    if (!serverHash) return false;
    return Object.keys(totpObjects).some(secret => {
      const computed = Totp.hashTotpSecret(secret, uid);
      return computed === serverHash;
    });
  }
};

export default Totp;
