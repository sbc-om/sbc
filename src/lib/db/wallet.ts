/**
 * Wallet Database Functions
 * Handles wallet operations: balance, deposit, withdraw, transfer
 */
import { nanoid } from "nanoid";
import { query, transaction } from "./postgres";

export type WalletTransactionType = "deposit" | "withdraw" | "transfer_in" | "transfer_out";

export interface Wallet {
  userId: string;
  balance: number;
  accountNumber: string; // Same as user phone
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletTransaction {
  id: string;
  walletUserId: string;
  type: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  relatedUserId: string | null;
  relatedPhone: string | null;
  description: string | null;
  createdAt: Date;
}

export interface WalletTransactionParty {
  userId: string | null;
  displayName: string | null;
  phone: string | null;
  accountNumber: string | null;
}

export interface WalletTransactionDetail {
  id: string;
  type: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  createdAt: Date;
  walletOwner: WalletTransactionParty;
  sender: WalletTransactionParty | null;
  receiver: WalletTransactionParty | null;
}

/**
 * Get user wallet (creates one if it doesn't exist)
 */
export async function getUserWallet(userId: string): Promise<Wallet | null> {
  const result = await query<{
    user_id: string;
    balance: string;
    account_number: string;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT w.user_id, w.balance, w.account_number, w.created_at, w.updated_at
     FROM wallets w
     WHERE w.user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    userId: row.user_id,
    balance: parseFloat(row.balance),
    accountNumber: row.account_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get total pending withdrawal amount for a user
 */
export async function getPendingWithdrawalsTotal(userId: string): Promise<number> {
  const result = await query<{ total: string }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM withdrawal_requests
     WHERE user_id = $1 AND status = 'pending'`,
    [userId]
  );
  return parseFloat(result.rows[0].total);
}

/**
 * Get available balance (total balance - pending withdrawals)
 */
export async function getAvailableBalance(userId: string): Promise<{ balance: number; pendingWithdrawals: number; availableBalance: number } | null> {
  const wallet = await getUserWallet(userId);
  if (!wallet) return null;
  
  const pendingWithdrawals = await getPendingWithdrawalsTotal(userId);
  return {
    balance: wallet.balance,
    pendingWithdrawals,
    availableBalance: wallet.balance - pendingWithdrawals,
  };
}

/**
 * Get wallet balances for all users (bulk).
 * Returns a map of userId → balance.
 */
export async function getAllWalletBalances(): Promise<Record<string, number>> {
  const result = await query<{ user_id: string; balance: string }>(
    `SELECT user_id, balance FROM wallets`
  );
  const map: Record<string, number> = {};
  for (const row of result.rows) {
    map[row.user_id] = parseFloat(row.balance);
  }
  return map;
}

/**
 * Get wallet by account number (phone)
 */
export async function getWalletByAccountNumber(accountNumber: string): Promise<Wallet | null> {
  // Normalize phone number - remove leading zeros and add country code if needed
  const normalizedPhone = normalizePhoneNumber(accountNumber);
  
  const result = await query<{
    user_id: string;
    balance: string;
    account_number: string;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT w.user_id, w.balance, w.account_number, w.created_at, w.updated_at
     FROM wallets w
     WHERE w.account_number = $1`,
    [normalizedPhone]
  );

  if (result.rows.length === 0) {
    // Try without normalization
    const result2 = await query<{
      user_id: string;
      balance: string;
      account_number: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT w.user_id, w.balance, w.account_number, w.created_at, w.updated_at
       FROM wallets w
       WHERE w.account_number = $1`,
      [accountNumber]
    );
    
    if (result2.rows.length === 0) return null;
    
    const row = result2.rows[0];
    return {
      userId: row.user_id,
      balance: parseFloat(row.balance),
      accountNumber: row.account_number,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  const row = result.rows[0];
  return {
    userId: row.user_id,
    balance: parseFloat(row.balance),
    accountNumber: row.account_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create a wallet for a user
 */
export async function createWallet(userId: string, phone: string): Promise<Wallet> {
  const normalizedPhone = normalizePhoneNumber(phone);
  
  const result = await query<{
    user_id: string;
    balance: string;
    account_number: string;
    created_at: Date;
    updated_at: Date;
  }>(
    `INSERT INTO wallets (user_id, balance, account_number, created_at, updated_at)
     VALUES ($1, 0, $2, NOW(), NOW())
     ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
     RETURNING user_id, balance, account_number, created_at, updated_at`,
    [userId, normalizedPhone]
  );

  const row = result.rows[0];
  return {
    userId: row.user_id,
    balance: parseFloat(row.balance),
    accountNumber: row.account_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Ensure user has a wallet (create if not exists)
 */
export async function ensureWallet(userId: string, phone: string): Promise<Wallet> {
  const existing = await getUserWallet(userId);
  if (existing) return existing;
  return createWallet(userId, phone);
}

/**
 * Deposit funds to wallet (admin only)
 */
export async function depositToWallet(
  userId: string,
  amount: number,
  description?: string
): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  return transaction(async (client) => {
    // Lock the wallet row for update
    const walletResult = await client.query<{
      user_id: string;
      balance: string;
      account_number: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT user_id, balance, account_number, created_at, updated_at
       FROM wallets
       WHERE user_id = $1
       FOR UPDATE`,
      [userId]
    );

    if (walletResult.rows.length === 0) {
      throw new Error("Wallet not found");
    }

    const currentBalance = parseFloat(walletResult.rows[0].balance);
    const newBalance = currentBalance + amount;

    // Update balance
    await client.query(
      `UPDATE wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2`,
      [newBalance, userId]
    );

    // Create transaction record
    const txId = nanoid();
    const txResult = await client.query<{
      id: string;
      wallet_user_id: string;
      type: string;
      amount: string;
      balance_before: string;
      balance_after: string;
      related_user_id: string | null;
      related_phone: string | null;
      description: string | null;
      created_at: Date;
    }>(
      `INSERT INTO wallet_transactions 
       (id, wallet_user_id, type, amount, balance_before, balance_after, description, created_at)
       VALUES ($1, $2, 'deposit', $3, $4, $5, $6, NOW())
       RETURNING *`,
      [txId, userId, amount, currentBalance, newBalance, description || "Wallet deposit"]
    );

    const txRow = txResult.rows[0];

    return {
      wallet: {
        userId: walletResult.rows[0].user_id,
        balance: newBalance,
        accountNumber: walletResult.rows[0].account_number,
        createdAt: walletResult.rows[0].created_at,
        updatedAt: new Date(),
      },
      transaction: {
        id: txRow.id,
        walletUserId: txRow.wallet_user_id,
        type: txRow.type as WalletTransactionType,
        amount: parseFloat(txRow.amount),
        balanceBefore: parseFloat(txRow.balance_before),
        balanceAfter: parseFloat(txRow.balance_after),
        relatedUserId: txRow.related_user_id,
        relatedPhone: txRow.related_phone,
        description: txRow.description,
        createdAt: txRow.created_at,
      },
    };
  });
}

/**
 * Withdraw funds from wallet
 */
export async function withdrawFromWallet(
  userId: string,
  amount: number,
  description?: string
): Promise<{ wallet: Wallet; transaction: WalletTransaction }> {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  return transaction(async (client) => {
    // Lock the wallet row for update
    const walletResult = await client.query<{
      user_id: string;
      balance: string;
      account_number: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT user_id, balance, account_number, created_at, updated_at
       FROM wallets
       WHERE user_id = $1
       FOR UPDATE`,
      [userId]
    );

    if (walletResult.rows.length === 0) {
      throw new Error("Wallet not found");
    }

    const currentBalance = parseFloat(walletResult.rows[0].balance);
    
    if (currentBalance < amount) {
      throw new Error("Insufficient balance");
    }

    const newBalance = currentBalance - amount;

    // Update balance
    await client.query(
      `UPDATE wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2`,
      [newBalance, userId]
    );

    // Create transaction record
    const txId = nanoid();
    const txResult = await client.query<{
      id: string;
      wallet_user_id: string;
      type: string;
      amount: string;
      balance_before: string;
      balance_after: string;
      related_user_id: string | null;
      related_phone: string | null;
      description: string | null;
      created_at: Date;
    }>(
      `INSERT INTO wallet_transactions 
       (id, wallet_user_id, type, amount, balance_before, balance_after, description, created_at)
       VALUES ($1, $2, 'withdraw', $3, $4, $5, $6, NOW())
       RETURNING *`,
      [txId, userId, amount, currentBalance, newBalance, description || "Wallet withdrawal"]
    );

    const txRow = txResult.rows[0];

    return {
      wallet: {
        userId: walletResult.rows[0].user_id,
        balance: newBalance,
        accountNumber: walletResult.rows[0].account_number,
        createdAt: walletResult.rows[0].created_at,
        updatedAt: new Date(),
      },
      transaction: {
        id: txRow.id,
        walletUserId: txRow.wallet_user_id,
        type: txRow.type as WalletTransactionType,
        amount: parseFloat(txRow.amount),
        balanceBefore: parseFloat(txRow.balance_before),
        balanceAfter: parseFloat(txRow.balance_after),
        relatedUserId: txRow.related_user_id,
        relatedPhone: txRow.related_phone,
        description: txRow.description,
        createdAt: txRow.created_at,
      },
    };
  });
}

/**
 * Transfer funds between wallets
 */
export async function transferFunds(
  fromUserId: string,
  toAccountNumber: string,
  amount: number,
  description?: string
): Promise<{
  fromWallet: Wallet;
  toWallet: Wallet;
  outTransaction: WalletTransaction;
  inTransaction: WalletTransaction;
}> {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  return transaction(async (client) => {
    // Get sender wallet
    const senderResult = await client.query<{
      user_id: string;
      balance: string;
      account_number: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT user_id, balance, account_number, created_at, updated_at
       FROM wallets
       WHERE user_id = $1
       FOR UPDATE`,
      [fromUserId]
    );

    if (senderResult.rows.length === 0) {
      throw new Error("Sender wallet not found");
    }

    const senderBalance = parseFloat(senderResult.rows[0].balance);
    
    // Check available balance (balance - pending withdrawals)
    const pendingResult = await client.query<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM withdrawal_requests
       WHERE user_id = $1 AND status = 'pending'`,
      [fromUserId]
    );
    const pendingAmount = parseFloat(pendingResult.rows[0].total);
    const availableBalance = senderBalance - pendingAmount;
    
    if (availableBalance < amount) {
      throw new Error("Insufficient available balance");
    }

    // Find receiver by account number (phone)
    const normalizedPhone = normalizePhoneNumber(toAccountNumber);
    let receiverResult = await client.query<{
      user_id: string;
      balance: string;
      account_number: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT user_id, balance, account_number, created_at, updated_at
       FROM wallets
       WHERE account_number = $1
       FOR UPDATE`,
      [normalizedPhone]
    );

    // Try without normalization if not found
    if (receiverResult.rows.length === 0) {
      receiverResult = await client.query<{
        user_id: string;
        balance: string;
        account_number: string;
        created_at: Date;
        updated_at: Date;
      }>(
        `SELECT user_id, balance, account_number, created_at, updated_at
         FROM wallets
         WHERE account_number = $1
         FOR UPDATE`,
        [toAccountNumber]
      );
    }

    if (receiverResult.rows.length === 0) {
      throw new Error("Receiver wallet not found");
    }

    if (receiverResult.rows[0].user_id === fromUserId) {
      throw new Error("Cannot transfer to yourself");
    }

    const receiverBalance = parseFloat(receiverResult.rows[0].balance);

    // Calculate new balances
    const newSenderBalance = senderBalance - amount;
    const newReceiverBalance = receiverBalance + amount;

    // Update sender balance
    await client.query(
      `UPDATE wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2`,
      [newSenderBalance, fromUserId]
    );

    // Update receiver balance
    await client.query(
      `UPDATE wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2`,
      [newReceiverBalance, receiverResult.rows[0].user_id]
    );

    // Create outgoing transaction for sender
    const outTxId = nanoid();
    const outTxResult = await client.query<{
      id: string;
      wallet_user_id: string;
      type: string;
      amount: string;
      balance_before: string;
      balance_after: string;
      related_user_id: string | null;
      related_phone: string | null;
      description: string | null;
      created_at: Date;
    }>(
      `INSERT INTO wallet_transactions 
       (id, wallet_user_id, type, amount, balance_before, balance_after, related_user_id, related_phone, description, created_at)
       VALUES ($1, $2, 'transfer_out', $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        outTxId,
        fromUserId,
        amount,
        senderBalance,
        newSenderBalance,
        receiverResult.rows[0].user_id,
        receiverResult.rows[0].account_number,
        description || `Transfer to ${receiverResult.rows[0].account_number}`,
      ]
    );

    // Create incoming transaction for receiver
    const inTxId = nanoid();
    const inTxResult = await client.query<{
      id: string;
      wallet_user_id: string;
      type: string;
      amount: string;
      balance_before: string;
      balance_after: string;
      related_user_id: string | null;
      related_phone: string | null;
      description: string | null;
      created_at: Date;
    }>(
      `INSERT INTO wallet_transactions 
       (id, wallet_user_id, type, amount, balance_before, balance_after, related_user_id, related_phone, description, created_at)
       VALUES ($1, $2, 'transfer_in', $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        inTxId,
        receiverResult.rows[0].user_id,
        amount,
        receiverBalance,
        newReceiverBalance,
        fromUserId,
        senderResult.rows[0].account_number,
        description || `Received from ${senderResult.rows[0].account_number}`,
      ]
    );

    const outTx = outTxResult.rows[0];
    const inTx = inTxResult.rows[0];

    return {
      fromWallet: {
        userId: senderResult.rows[0].user_id,
        balance: newSenderBalance,
        accountNumber: senderResult.rows[0].account_number,
        createdAt: senderResult.rows[0].created_at,
        updatedAt: new Date(),
      },
      toWallet: {
        userId: receiverResult.rows[0].user_id,
        balance: newReceiverBalance,
        accountNumber: receiverResult.rows[0].account_number,
        createdAt: receiverResult.rows[0].created_at,
        updatedAt: new Date(),
      },
      outTransaction: {
        id: outTx.id,
        walletUserId: outTx.wallet_user_id,
        type: outTx.type as WalletTransactionType,
        amount: parseFloat(outTx.amount),
        balanceBefore: parseFloat(outTx.balance_before),
        balanceAfter: parseFloat(outTx.balance_after),
        relatedUserId: outTx.related_user_id,
        relatedPhone: outTx.related_phone,
        description: outTx.description,
        createdAt: outTx.created_at,
      },
      inTransaction: {
        id: inTx.id,
        walletUserId: inTx.wallet_user_id,
        type: inTx.type as WalletTransactionType,
        amount: parseFloat(inTx.amount),
        balanceBefore: parseFloat(inTx.balance_before),
        balanceAfter: parseFloat(inTx.balance_after),
        relatedUserId: inTx.related_user_id,
        relatedPhone: inTx.related_phone,
        description: inTx.description,
        createdAt: inTx.created_at,
      },
    };
  });
}

/**
 * Get wallet transactions
 */
export async function getWalletTransactions(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<WalletTransaction[]> {
  const result = await query<{
    id: string;
    wallet_user_id: string;
    type: string;
    amount: string;
    balance_before: string;
    balance_after: string;
    related_user_id: string | null;
    related_phone: string | null;
    description: string | null;
    created_at: Date;
  }>(
    `SELECT id, wallet_user_id, type, amount, balance_before, balance_after,
            related_user_id, related_phone, description, created_at
     FROM wallet_transactions
     WHERE wallet_user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return result.rows.map((row) => ({
    id: row.id,
    walletUserId: row.wallet_user_id,
    type: row.type as WalletTransactionType,
    amount: parseFloat(row.amount),
    balanceBefore: parseFloat(row.balance_before),
    balanceAfter: parseFloat(row.balance_after),
    relatedUserId: row.related_user_id,
    relatedPhone: row.related_phone,
    description: row.description,
    createdAt: row.created_at,
  }));
}

/**
 * Get full details for a single wallet transaction owned by a user.
 */
export async function getWalletTransactionDetail(
  userId: string,
  transactionId: string
): Promise<WalletTransactionDetail | null> {
  const result = await query<{
    id: string;
    wallet_user_id: string;
    type: string;
    amount: string;
    balance_before: string;
    balance_after: string;
    related_user_id: string | null;
    related_phone: string | null;
    description: string | null;
    created_at: Date;
    owner_display_name: string | null;
    owner_full_name: string | null;
    owner_email: string | null;
    owner_phone: string | null;
    owner_account_number: string | null;
    related_display_name: string | null;
    related_full_name: string | null;
    related_email: string | null;
    related_phone_from_user: string | null;
    related_account_number: string | null;
  }>(
    `SELECT
        wt.id,
        wt.wallet_user_id,
        wt.type,
        wt.amount,
        wt.balance_before,
        wt.balance_after,
        wt.related_user_id,
        wt.related_phone,
        wt.description,
        wt.created_at,
        ou.display_name AS owner_display_name,
        ou.full_name AS owner_full_name,
        ou.email AS owner_email,
        ou.phone AS owner_phone,
        ow.account_number AS owner_account_number,
        ru.display_name AS related_display_name,
        ru.full_name AS related_full_name,
        ru.email AS related_email,
        ru.phone AS related_phone_from_user,
        rw.account_number AS related_account_number
     FROM wallet_transactions wt
     LEFT JOIN users ou ON ou.id = wt.wallet_user_id
     LEFT JOIN wallets ow ON ow.user_id = wt.wallet_user_id
     LEFT JOIN users ru ON ru.id = wt.related_user_id
     LEFT JOIN wallets rw ON rw.user_id = wt.related_user_id
     WHERE wt.id = $1 AND wt.wallet_user_id = $2
     LIMIT 1`,
    [transactionId, userId]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];

  const ownerParty: WalletTransactionParty = {
    userId: row.wallet_user_id,
    displayName: row.owner_display_name || row.owner_full_name || row.owner_email,
    phone: row.owner_phone,
    accountNumber: row.owner_account_number,
  };

  const relatedParty: WalletTransactionParty | null = row.related_user_id || row.related_phone
    ? {
        userId: row.related_user_id,
        displayName: row.related_display_name || row.related_full_name || row.related_email || null,
        phone: row.related_phone_from_user || row.related_phone,
        accountNumber: row.related_account_number || row.related_phone,
      }
    : null;

  let sender: WalletTransactionParty | null = null;
  let receiver: WalletTransactionParty | null = null;
  const txType = row.type as WalletTransactionType;

  if (txType === "transfer_out") {
    sender = ownerParty;
    receiver = relatedParty;
  } else if (txType === "transfer_in") {
    sender = relatedParty;
    receiver = ownerParty;
  } else if (txType === "deposit") {
    sender = null;
    receiver = ownerParty;
  } else if (txType === "withdraw") {
    sender = ownerParty;
    receiver = null;
  }

  return {
    id: row.id,
    type: txType,
    amount: parseFloat(row.amount),
    balanceBefore: parseFloat(row.balance_before),
    balanceAfter: parseFloat(row.balance_after),
    description: row.description,
    createdAt: row.created_at,
    walletOwner: ownerParty,
    sender,
    receiver,
  };
}

/**
 * Get user info by phone (for transfer validation)
 */
export async function getUserByPhone(phone: string): Promise<{ id: string; displayName: string; phone: string } | null> {
  const variants = getPhoneVariants(phone);
  
  // Search for user with any of the phone variants
  const result = await query<{
    id: string;
    display_name: string | null;
    full_name: string;
    phone: string;
  }>(
    `SELECT id, display_name, full_name, phone
     FROM users
     WHERE phone = ANY($1)`,
    [variants]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: row.id,
    displayName: row.display_name || row.full_name,
    phone: row.phone,
  };
}

// ============================================
// Withdrawal Request Functions
// ============================================

export type WithdrawalRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  status: WithdrawalRequestStatus;
  adminMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  userDisplayName?: string;
  userPhone?: string;
  userBalance?: number;
}

/**
 * Create a withdrawal request
 */
export async function createWithdrawalRequest(
  userId: string,
  amount: number
): Promise<WithdrawalRequest> {
  if (amount <= 0) {
    throw new Error("Amount must be positive");
  }

  // Check available balance (balance - pending withdrawals)
  const balanceInfo = await getAvailableBalance(userId);
  if (!balanceInfo) {
    throw new Error("Wallet not found");
  }

  if (balanceInfo.availableBalance < amount) {
    throw new Error("Insufficient available balance");
  }

  const id = nanoid();
  const result = await query<{
    id: string;
    user_id: string;
    amount: string;
    status: string;
    admin_message: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `INSERT INTO withdrawal_requests (id, user_id, amount, status, created_at, updated_at)
     VALUES ($1, $2, $3, 'pending', NOW(), NOW())
     RETURNING *`,
    [id, userId, amount]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    amount: parseFloat(row.amount),
    status: row.status as WithdrawalRequestStatus,
    adminMessage: row.admin_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get user's withdrawal requests
 */
export async function getUserWithdrawalRequests(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<WithdrawalRequest[]> {
  const result = await query<{
    id: string;
    user_id: string;
    amount: string;
    status: string;
    admin_message: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `SELECT * FROM withdrawal_requests
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return result.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    amount: parseFloat(row.amount),
    status: row.status as WithdrawalRequestStatus,
    adminMessage: row.admin_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Count withdrawal requests (admin only)
 */
export async function countWithdrawalRequests(
  status?: WithdrawalRequestStatus,
  search?: string
): Promise<number> {
  let queryStr = `
    SELECT COUNT(*) as count
    FROM withdrawal_requests wr
    JOIN users u ON wr.user_id = u.id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  let paramIndex = 1;
  
  if (status) {
    queryStr += ` AND wr.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (search) {
    queryStr += ` AND (u.display_name ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
  }

  const result = await query<{ count: string }>(queryStr, params);
  return parseInt(result.rows[0]?.count || "0", 10);
}

/**
 * Get all pending withdrawal requests (admin only)
 */
export async function getAllWithdrawalRequests(
  status?: WithdrawalRequestStatus,
  limit: number = 100,
  offset: number = 0,
  search?: string
): Promise<WithdrawalRequest[]> {
  let queryStr = `
    SELECT wr.*, 
           u.display_name, u.full_name, u.phone,
           w.balance,
           COALESCE((
             SELECT SUM(amount) 
             FROM withdrawal_requests 
             WHERE user_id = wr.user_id AND status = 'pending'
           ), 0) as pending_amount
    FROM withdrawal_requests wr
    JOIN users u ON wr.user_id = u.id
    LEFT JOIN wallets w ON wr.user_id = w.user_id
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  let paramIndex = 1;
  
  if (status) {
    queryStr += ` AND wr.status = $${paramIndex++}`;
    params.push(status);
  }
  
  if (search) {
    queryStr += ` AND (u.display_name ILIKE $${paramIndex} OR u.full_name ILIKE $${paramIndex} OR u.phone ILIKE $${paramIndex})`;
    paramIndex++;
    params.push(`%${search}%`);
  }
  
  queryStr += ` ORDER BY wr.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await query<{
    id: string;
    user_id: string;
    amount: string;
    status: string;
    admin_message: string | null;
    created_at: Date;
    updated_at: Date;
    display_name: string | null;
    full_name: string;
    phone: string;
    balance: string | null;
    pending_amount: string;
  }>(queryStr, params);

  return result.rows.map((row) => {
    const balance = row.balance ? parseFloat(row.balance) : 0;
    const pendingAmount = parseFloat(row.pending_amount);
    // For this specific request, available = balance - (pending - this request's amount if pending)
    const thisAmount = parseFloat(row.amount);
    const otherPending = row.status === 'pending' ? pendingAmount - thisAmount : pendingAmount;
    const availableForApproval = balance - otherPending;
    
    return {
      id: row.id,
      userId: row.user_id,
      amount: thisAmount,
      status: row.status as WithdrawalRequestStatus,
      adminMessage: row.admin_message,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      userDisplayName: row.display_name || row.full_name,
      userPhone: row.phone,
      userBalance: availableForApproval,  // This is available balance for approval
    };
  });
}

/**
 * Approve a withdrawal request (admin only)
 * This will deduct the amount from user's wallet
 */
export async function approveWithdrawalRequest(
  requestId: string,
  adminMessage?: string
): Promise<{ request: WithdrawalRequest; transaction: WalletTransaction }> {
  return transaction(async (client) => {
    // Lock the request
    const reqResult = await client.query<{
      id: string;
      user_id: string;
      amount: string;
      status: string;
      admin_message: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT * FROM withdrawal_requests WHERE id = $1 FOR UPDATE`,
      [requestId]
    );

    if (reqResult.rows.length === 0) {
      throw new Error("Request not found");
    }

    const req = reqResult.rows[0];
    if (req.status !== "pending") {
      throw new Error("Request already processed");
    }

    const amount = parseFloat(req.amount);

    // Lock the wallet
    const walletResult = await client.query<{
      user_id: string;
      balance: string;
      account_number: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE`,
      [req.user_id]
    );

    if (walletResult.rows.length === 0) {
      throw new Error("Wallet not found");
    }

    const currentBalance = parseFloat(walletResult.rows[0].balance);
    if (currentBalance < amount) {
      throw new Error("Insufficient balance");
    }

    const newBalance = currentBalance - amount;

    // Update wallet balance
    await client.query(
      `UPDATE wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2`,
      [newBalance, req.user_id]
    );

    // Create transaction record
    const txId = nanoid();
    const txResult = await client.query<{
      id: string;
      wallet_user_id: string;
      type: string;
      amount: string;
      balance_before: string;
      balance_after: string;
      related_user_id: string | null;
      related_phone: string | null;
      description: string | null;
      created_at: Date;
    }>(
      `INSERT INTO wallet_transactions 
       (id, wallet_user_id, type, amount, balance_before, balance_after, description, created_at)
       VALUES ($1, $2, 'withdraw', $3, $4, $5, $6, NOW())
       RETURNING *`,
      [txId, req.user_id, amount, currentBalance, newBalance, adminMessage || "Wallet withdrawal"]
    );

    // Update request status
    const updatedReq = await client.query<{
      id: string;
      user_id: string;
      amount: string;
      status: string;
      admin_message: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `UPDATE withdrawal_requests 
       SET status = 'approved', admin_message = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [requestId, adminMessage]
    );

    const updatedRow = updatedReq.rows[0];
    const txRow = txResult.rows[0];

    return {
      request: {
        id: updatedRow.id,
        userId: updatedRow.user_id,
        amount: parseFloat(updatedRow.amount),
        status: updatedRow.status as WithdrawalRequestStatus,
        adminMessage: updatedRow.admin_message,
        createdAt: updatedRow.created_at,
        updatedAt: updatedRow.updated_at,
      },
      transaction: {
        id: txRow.id,
        walletUserId: txRow.wallet_user_id,
        type: txRow.type as WalletTransactionType,
        amount: parseFloat(txRow.amount),
        balanceBefore: parseFloat(txRow.balance_before),
        balanceAfter: parseFloat(txRow.balance_after),
        relatedUserId: txRow.related_user_id,
        relatedPhone: txRow.related_phone,
        description: txRow.description,
        createdAt: txRow.created_at,
      },
    };
  });
}

/**
 * Reject a withdrawal request (admin only)
 */
export async function rejectWithdrawalRequest(
  requestId: string,
  adminMessage?: string
): Promise<WithdrawalRequest> {
  const result = await query<{
    id: string;
    user_id: string;
    amount: string;
    status: string;
    admin_message: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `UPDATE withdrawal_requests 
     SET status = 'rejected', admin_message = $2, updated_at = NOW()
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [requestId, adminMessage]
  );

  if (result.rows.length === 0) {
    throw new Error("Request not found or already processed");
  }

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    amount: parseFloat(row.amount),
    status: row.status as WithdrawalRequestStatus,
    adminMessage: row.admin_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Cancel a withdrawal request (by user - only pending requests)
 */
export async function cancelWithdrawalRequest(
  requestId: string,
  userId: string
): Promise<WithdrawalRequest> {
  const result = await query<{
    id: string;
    user_id: string;
    amount: string;
    status: string;
    admin_message: string | null;
    created_at: Date;
    updated_at: Date;
  }>(
    `UPDATE withdrawal_requests 
     SET status = 'cancelled', updated_at = NOW()
     WHERE id = $1 AND user_id = $2 AND status = 'pending'
     RETURNING *`,
    [requestId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error("Request not found, not yours, or already processed");
  }

  const row = result.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    amount: parseFloat(row.amount),
    status: row.status as WithdrawalRequestStatus,
    adminMessage: row.admin_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Normalize phone number - removes +, leading zeros, adds country code if needed
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters (including +)
  let cleaned = phone.replace(/\D/g, "");
  
  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, "");
  
  // If it starts with country code (like 968), keep it, otherwise assume it needs one
  // For Oman, country code is 968
  if (cleaned.length === 8) {
    cleaned = "968" + cleaned;
  }
  
  return cleaned;
}

/**
 * Get all possible phone formats for lookup
 */
function getPhoneVariants(phone: string): string[] {
  const normalized = normalizePhoneNumber(phone);
  const variants = new Set<string>();
  
  // Add normalized version
  variants.add(normalized);
  
  // Add with + prefix
  variants.add("+" + normalized);
  
  // Add original
  variants.add(phone);
  
  // If it starts with country code, also try without it
  if (normalized.startsWith("968") && normalized.length === 11) {
    variants.add(normalized.slice(3));
  }
  
  return Array.from(variants);
}
