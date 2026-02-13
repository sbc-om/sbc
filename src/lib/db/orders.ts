/**
 * Store Orders Database Module
 * Handles order creation, listing, and reporting for the store
 */
import { nanoid } from "nanoid";
import { query, transaction, initSchema } from "./postgres";

// SBC Treasury Constants
export const SBC_TREASURY_ACCOUNT_NUMBER = "sbc";
export const SBC_TREASURY_USER_ID = "sbc-treasury";

export type OrderStatus = "pending" | "completed" | "cancelled" | "refunded";
export type PaymentMethod = "wallet";

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  total: number;
  currency: string;
  walletTransactionId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productSlug: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  currency: string;
  createdAt: Date;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  user?: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
  };
}

export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  averageOrderValue: number;
}

export interface DailySalesReport {
  date: string;
  orders: number;
  revenue: number;
  itemsSold: number;
}

export interface ProductSalesReport {
  productId: string;
  productSlug: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
}

type OrderRow = {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  subtotal: string | number;
  total: string | number;
  currency: string;
  wallet_transaction_id: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  quantity: number;
  unit_price: string | number;
  total: string | number;
  currency: string;
  created_at: Date;
};

type OrderWithUserRow = OrderRow & {
  email: string;
  full_name: string;
  phone: string | null;
};

function toNumber(value: string | number): number {
  return typeof value === "number" ? value : parseFloat(value);
}

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    status: row.status as OrderStatus,
    paymentMethod: row.payment_method as PaymentMethod,
    subtotal: toNumber(row.subtotal),
    total: toNumber(row.total),
    currency: row.currency,
    walletTransactionId: row.wallet_transaction_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productSlug: row.product_slug,
    productName: row.product_name,
    quantity: row.quantity,
    unitPrice: toNumber(row.unit_price),
    total: toNumber(row.total),
    currency: row.currency,
    createdAt: row.created_at,
  };
}

/**
 * Generate a unique order number (SBC-YYYYMMDD-XXXXX)
 */
function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `SBC-${dateStr}-${random}`;
}

/**
 * Create a new order
 */
export async function createOrder(input: {
  userId: string;
  items: Array<{
    productId: string;
    productSlug: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    currency: string;
  }>;
  paymentMethod: PaymentMethod;
  walletTransactionId?: string;
  notes?: string;
}): Promise<OrderWithItems> {
  console.log("[Orders] Creating order for user:", input.userId, "items:", input.items.length);
  
  try {
    await initSchema(); // Ensure tables exist
    
    return transaction(async (client) => {
      const orderId = nanoid();
      const orderNumber = generateOrderNumber();
      const now = new Date();
      
      // Calculate totals
      const subtotal = input.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      const total = subtotal; // No additional fees for now
      const currency = input.items[0]?.currency || "OMR";

    // Create order
    const orderResult = await client.query<OrderRow>(
      `INSERT INTO store_orders (
        id, order_number, user_id, status, payment_method, 
        subtotal, total, currency, wallet_transaction_id, notes, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
      RETURNING *`,
      [
        orderId,
        orderNumber,
        input.userId,
        "completed" as OrderStatus,
        input.paymentMethod,
        subtotal,
        total,
        currency,
        input.walletTransactionId || null,
        input.notes || null,
        now,
      ]
    );

    const order = rowToOrder(orderResult.rows[0]);

    // Create order items
    const items: OrderItem[] = [];
    for (const item of input.items) {
      const itemId = nanoid();
      const itemTotal = item.unitPrice * item.quantity;
      
      const itemResult = await client.query<OrderItemRow>(
        `INSERT INTO store_order_items (
          id, order_id, product_id, product_slug, product_name,
          quantity, unit_price, total, currency, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          itemId,
          orderId,
          item.productId,
          item.productSlug,
          item.productName,
          item.quantity,
          item.unitPrice,
          itemTotal,
          item.currency,
          now,
        ]
      );
      
      items.push(rowToOrderItem(itemResult.rows[0]));
    }

    console.log("[Orders] Order created successfully:", orderNumber);
    return { ...order, items };
    });
  } catch (e) {
    console.error("[Orders] createOrder error:", e);
    throw e;
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(id: string): Promise<OrderWithItems | null> {
  const orderResult = await query<OrderWithUserRow>(
    `SELECT o.*, u.email, u.full_name, u.phone 
     FROM store_orders o
     LEFT JOIN users u ON o.user_id = u.id
     WHERE o.id = $1`,
    [id]
  );

  if (orderResult.rows.length === 0) return null;

  const row = orderResult.rows[0];
  const order = rowToOrder(row);

  const itemsResult = await query<OrderItemRow>(
    `SELECT * FROM store_order_items WHERE order_id = $1 ORDER BY created_at`,
    [id]
  );

  return {
    ...order,
    items: itemsResult.rows.map(rowToOrderItem),
    user: {
      id: row.user_id,
      email: row.email,
      fullName: row.full_name,
      phone: row.phone,
    },
  };
}

/**
 * Get order by order number
 */
export async function getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null> {
  const orderResult = await query<OrderWithUserRow>(
    `SELECT o.*, u.email, u.full_name, u.phone 
     FROM store_orders o
     LEFT JOIN users u ON o.user_id = u.id
     WHERE o.order_number = $1`,
    [orderNumber]
  );

  if (orderResult.rows.length === 0) return null;

  const row = orderResult.rows[0];
  const order = rowToOrder(row);

  const itemsResult = await query<OrderItemRow>(
    `SELECT * FROM store_order_items WHERE order_id = $1 ORDER BY created_at`,
    [order.id]
  );

  return {
    ...order,
    items: itemsResult.rows.map(rowToOrderItem),
    user: {
      id: row.user_id,
      email: row.email,
      fullName: row.full_name,
      phone: row.phone,
    },
  };
}

/**
 * List orders for a user
 */
export async function listUserOrders(userId: string): Promise<OrderWithItems[]> {
  const ordersResult = await query<OrderRow>(
    `SELECT * FROM store_orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );

  const orders: OrderWithItems[] = [];
  for (const row of ordersResult.rows) {
    const order = rowToOrder(row);
    const itemsResult = await query<OrderItemRow>(
      `SELECT * FROM store_order_items WHERE order_id = $1`,
      [order.id]
    );
    orders.push({
      ...order,
      items: itemsResult.rows.map(rowToOrderItem),
    });
  }

  return orders;
}

/**
 * List all orders (admin)
 */
export async function listAllOrders(options?: {
  status?: OrderStatus;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ orders: OrderWithItems[]; total: number }> {
  try {
    await initSchema(); // Ensure tables exist
    
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options?.status) {
      conditions.push(`o.status = $${paramIndex++}`);
      params.push(options.status);
    }

    if (options?.startDate) {
      conditions.push(`o.created_at >= $${paramIndex++}`);
      params.push(options.startDate);
    }

    if (options?.endDate) {
      conditions.push(`o.created_at <= $${paramIndex++}`);
      params.push(options.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM store_orders o ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get orders with pagination
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    
    const ordersResult = await query<OrderWithUserRow>(
      `SELECT o.*, u.email, u.full_name, u.phone 
       FROM store_orders o
       LEFT JOIN users u ON o.user_id = u.id
       ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    const orders: OrderWithItems[] = [];
    for (const row of ordersResult.rows) {
      const order = rowToOrder(row);
      const itemsResult = await query<OrderItemRow>(
        `SELECT * FROM store_order_items WHERE order_id = $1`,
        [order.id]
      );
      orders.push({
        ...order,
        items: itemsResult.rows.map(rowToOrderItem),
        user: {
          id: row.user_id,
          email: row.email,
          fullName: row.full_name,
          phone: row.phone,
        },
      });
    }

    return { orders, total };
  } catch (e) {
    console.error("[Orders] listAllOrders error:", e);
    return { orders: [], total: 0 };
  }
}

/**
 * Get order summary/statistics
 */
export async function getOrderSummary(options?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<OrderSummary> {
  try {
    await initSchema(); // Ensure tables exist
    
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options?.startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(options.startDate);
    }

    if (options?.endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(options.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await query(
      `SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_revenue,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
        COUNT(*) FILTER (WHERE status = 'refunded') as refunded_orders,
        COALESCE(AVG(total) FILTER (WHERE status = 'completed'), 0) as average_order_value
       FROM store_orders ${whereClause}`,
      params
    );

    const row = result.rows[0];
    return {
      totalOrders: parseInt(row.total_orders),
      totalRevenue: parseFloat(row.total_revenue),
      completedOrders: parseInt(row.completed_orders),
      pendingOrders: parseInt(row.pending_orders),
      cancelledOrders: parseInt(row.cancelled_orders),
      refundedOrders: parseInt(row.refunded_orders),
      averageOrderValue: parseFloat(row.average_order_value),
    };
  } catch (e) {
    console.error("[Orders] getOrderSummary error:", e);
    return {
      totalOrders: 0,
      totalRevenue: 0,
      completedOrders: 0,
      pendingOrders: 0,
      cancelledOrders: 0,
      refundedOrders: 0,
      averageOrderValue: 0,
    };
  }
}

/**
 * Get daily sales report
 */
export async function getDailySalesReport(options?: {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<DailySalesReport[]> {
  try {
    await initSchema(); // Ensure tables exist
    
    const conditions: string[] = ["o.status = 'completed'"];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options?.startDate) {
      conditions.push(`o.created_at >= $${paramIndex++}`);
      params.push(options.startDate);
    }

    if (options?.endDate) {
      conditions.push(`o.created_at <= $${paramIndex++}`);
      params.push(options.endDate);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const limit = options?.limit || 30;

    const result = await query(
      `SELECT 
        DATE(o.created_at) as date,
        COUNT(DISTINCT o.id) as orders,
        COALESCE(SUM(o.total), 0) as revenue,
        COALESCE(SUM(oi.quantity), 0) as items_sold
       FROM store_orders o
       LEFT JOIN store_order_items oi ON o.id = oi.order_id
       ${whereClause}
       GROUP BY DATE(o.created_at)
       ORDER BY date DESC
       LIMIT $${paramIndex}`,
      [...params, limit]
    );

    return result.rows.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      orders: parseInt(row.orders),
      revenue: parseFloat(row.revenue),
      itemsSold: parseInt(row.items_sold),
    }));
  } catch (e) {
    console.error("[Orders] getDailySalesReport error:", e);
    return [];
  }
}

/**
 * Get product sales report
 */
export async function getProductSalesReport(options?: {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<ProductSalesReport[]> {
  try {
    await initSchema(); // Ensure tables exist
    
    const conditions: string[] = ["o.status = 'completed'"];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (options?.startDate) {
      conditions.push(`o.created_at >= $${paramIndex++}`);
      params.push(options.startDate);
    }

    if (options?.endDate) {
      conditions.push(`o.created_at <= $${paramIndex++}`);
      params.push(options.endDate);
    }

    const whereClause = `WHERE ${conditions.join(" AND ")}`;
    const limit = options?.limit || 20;

    const result = await query(
      `SELECT 
        oi.product_id,
        oi.product_slug,
        oi.product_name,
        SUM(oi.quantity) as total_sold,
        SUM(oi.total) as total_revenue
       FROM store_order_items oi
       JOIN store_orders o ON oi.order_id = o.id
       ${whereClause}
       GROUP BY oi.product_id, oi.product_slug, oi.product_name
       ORDER BY total_revenue DESC
       LIMIT $${paramIndex}`,
      [...params, limit]
    );

    return result.rows.map((row) => ({
      productId: row.product_id,
      productSlug: row.product_slug,
      productName: row.product_name,
      totalSold: parseInt(row.total_sold),
      totalRevenue: parseFloat(row.total_revenue),
    }));
  } catch (e) {
    console.error("[Orders] getProductSalesReport error:", e);
    return [];
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  const result = await query<OrderRow>(
    `UPDATE store_orders 
     SET status = $1, updated_at = NOW() 
     WHERE id = $2 
     RETURNING *`,
    [status, orderId]
  );

  if (result.rows.length === 0) {
    throw new Error("Order not found");
  }

  return rowToOrder(result.rows[0]);
}

/**
 * Get SBC Treasury balance
 */
export async function getTreasuryBalance(): Promise<{
  balance: number;
  totalDeposits: number;
  transactionCount: number;
}> {
  try {
    await initSchema(); // Ensure tables exist
    
    const walletResult = await query(
      `SELECT balance FROM wallets WHERE account_number = $1`,
      [SBC_TREASURY_ACCOUNT_NUMBER]
    );

    if (walletResult.rows.length === 0) {
      return { balance: 0, totalDeposits: 0, transactionCount: 0 };
    }

    const balance = parseFloat(walletResult.rows[0].balance);

    const statsResult = await query(
      `SELECT 
        COUNT(*) as transaction_count,
        COALESCE(SUM(amount) FILTER (WHERE type = 'deposit' OR type = 'transfer_in'), 0) as total_deposits
       FROM wallet_transactions 
       WHERE wallet_user_id = $1`,
      [SBC_TREASURY_USER_ID]
    );

    return {
      balance,
      totalDeposits: parseFloat(statsResult.rows[0].total_deposits),
      transactionCount: parseInt(statsResult.rows[0].transaction_count),
    };
  } catch (e) {
    console.error("[Orders] getTreasuryBalance error:", e);
    return { balance: 0, totalDeposits: 0, transactionCount: 0 };
  }
}

/**
 * Get treasury transactions
 */
export async function getTreasuryTransactions(options?: {
  limit?: number;
  offset?: number;
}): Promise<{
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    description: string | null;
    relatedUserId: string | null;
    relatedPhone: string | null;
    createdAt: Date;
  }>;
  total: number;
}> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const countResult = await query(
    `SELECT COUNT(*) as count FROM wallet_transactions WHERE wallet_user_id = $1`,
    [SBC_TREASURY_USER_ID]
  );

  const result = await query(
    `SELECT * FROM wallet_transactions 
     WHERE wallet_user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [SBC_TREASURY_USER_ID, limit, offset]
  );

  return {
    transactions: result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      amount: parseFloat(row.amount),
      balanceBefore: parseFloat(row.balance_before),
      balanceAfter: parseFloat(row.balance_after),
      description: row.description,
      relatedUserId: row.related_user_id,
      relatedPhone: row.related_phone,
      createdAt: row.created_at,
    })),
    total: parseInt(countResult.rows[0].count),
  };
}
