import {TOTP} from 'totp-generator';
import {storage} from './storage';
import { Subject } from 'rxjs';

const totpObjectsSubject = new Subject()

export const Totp = {
  onTotpObjectsChange: () => totpObjectsSubject.asObservable(),
  token: secret => {
    try {
      const {otp} = TOTP.generate(secret, {
        digits: 6,
        algorithm: 'SHA-1',
        period: 30,
      });
      console.log(`TOTP généré pour ${secret}: ${otp}`); // Pour déboguer
      return otp;
    } catch (error) {
      console.error('Erreur lors de la génération du TOTP:', error);
      return null;
    }
  },
  getTotpObjects: () => {
    const totpObjects = storage.getString('totpObjects');
    return totpObjects ? JSON.parse(totpObjects) : {};
  },
  isValid: (token, secret) => {
    try {
      const {otp} = TOTP.generate(secret, {
        digits: 6,
        algorithm: 'SHA-1',
        period: 30,
      });
      return token === otp;
    } catch (error) {
      console.error('Erreur lors de la validation du TOTP:', error);
      return false;
    }
  },
  setTotpObjects: objects => {
    storage.set('totpObjects', JSON.stringify(objects));
    console.log('📡 TotpObjects mis à jour, émission notification');
    totpObjectsSubject.next(objects);
  },
  formatCode: code => {
    if (!code) return 'N/A';
    return code.replace(/(\d{3})(\d{3})/, '$1 $2'); // Formater le code TOTP (ex. "123456" → "123 456")
  },
  parseTotpUrl: url => {
    try {
      console.log('URL scannée:', url); // Log pour déboguer

      // Vérifier si c'est une URL TOTP
      if (!url.startsWith('otpauth://totp/')) {
        throw new Error('URL non TOTP');
      }

      // Séparer path et query
      const [path, query] = url.split('?');

      // Parser query params manuellement
      let secret = '';
      if (query) {
        const params = query.split('&').reduce((acc, param) => {
          const [key, value] = param.split('=');
          acc[key] = value;
          return acc;
        }, {});
        secret = params.secret || '';
      }

      if (!secret) {
        throw new Error('Secret manquant');
      }

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

      // Gérer Issuer:Name
      /*if (name.includes(':')) {
          name = name.split(':').pop().trim();
        }*/

      console.log('Parsed:', {secret, name}); // Log résultat

      return {secret, name};
    } catch (error) {
      console.error('Erreur de parsing:', error);
      Alert.alert('Erreur', 'QR code invalide pour TOTP.');
      return null;
    }
  },
};

export default Totp;
