import { api } from '../lib/api';

export async function addGmailAccount() {
  throw new Error(
    'addGmailAccount() has been disabled because it contained hardcoded SMTP credentials. ' +
      'Create sending accounts through the UI or provide credentials securely via backend/env.'
  );
}
