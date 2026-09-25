export interface User {
    id: number;
    email: string;
    name: string;
    created_at?: string;
}

export interface SessionUser {
    id: number;
    email: string;
    name: string;
    roles: string[];
    permissions: string[];
    has_password: boolean;
}

export interface Customer {
    id: number;
    name: string;
    phone: string | null;
    total_loan: number;
    old_loan: number;
    created_at?: string;
}

export interface StockBatch {
    id: number;
    grams: number;
    total_cost: number;
    remaining_grams: number;
    realized_cost?: number;
    total_revenue?: number;
    created_at: string;
}

export interface SaleBatchAssignment {
    id?: number;
    sale_id: number;
    batch_id: number;
    grams_deducted: number;
    unit_cost?: number;
}

export interface Sale {
    id: number;
    customer_id: number;
    customer_name: string;
    grams_sold: number;
    gross_amount: number;
    discount: number;
    final_amount: number;
    amount_received: number;
    balance: number;
    comments: string | null;
    status?: 'POSTED' | 'REVERSED';
    created_at: string;
    batchesDeducted?: SaleBatchAssignment[];
}

export interface JournalEntry {
    id: number;
    entry_number: string;
    transaction_type: string;
    reference_type: string;
    reference_id: string;
    description: string;
    created_by_name: string;
    created_at: string;
    total_debit: number;
    total_credit: number;
    lines: JournalLine[];
}

export interface JournalLine {
    account_code: string;
    account_name: string;
    debit: number;
    credit: number;
    description: string | null;
}

export interface AuditLog {
    id: number;
    actor_name: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
}

export interface Payment {
    id: number;
    customer_id: number;
    amount: number;
    created_at: string;
}

export interface Settings {
    id?: number;
    rate_per_gram: number;
    special_025_030: number;
    special_050_060: number;
    updated_at?: string;
}

export interface TimelineItem {
    id: number;
    type: 'sale' | 'payment';
    grams?: number;
    final_amount?: number;
    amount_received: number;
    created_at: string;
    batch_numbers?: string;
    running_balance?: number;
}

export interface CustomerLedgerData {
    customer: Customer;
    timeline: TimelineItem[];
    summary: {
        totalGrams: number;
        totalPayments: number;
        finalBalance: number;
    };
}

export type DashboardPeriod = 7 | 30;
export type DashboardStockStatus = 'critical' | 'healthy' | 'warning';

export interface DashboardTrendPoint {
    date: string;
    profit: number;
    sales: number;
}

export interface DashboardStockBatch {
    ageDays: number;
    createdAt: string;
    id: number;
    originalGrams: number;
    remainingGrams: number;
}

export interface DashboardMetrics {
    period: DashboardPeriod;
    salesToday: {
        count: number;
        grams: number;
        amount: number;
        previousAmount: number;
        changePercent: number | null;
    };
    grossProfit: {
        amount: number;
        previousAmount: number;
        changePercent: number | null;
        marginPercent: number | null;
        revenue: number;
    };
    stock: {
        batches: DashboardStockBatch[];
        oldestBatchAgeDays: number;
        openBatchCount: number;
        status: DashboardStockStatus;
        totalGrams: number;
    };
    receivables: {
        customerCount: number;
        prioritizedCustomers: Customer[];
        total: number;
    };
    trend: DashboardTrendPoint[];
    recentSales: Sale[];
    setup: {
        hasCustomers: boolean;
        hasSales: boolean;
        hasStock: boolean;
    };
}

export interface ActionResult<T = void> {
    success?: boolean;
    error?: string;
    data?: T;
    saleId?: number | bigint;
}
