"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteSale } from "@/lib/actions/sale.actions";
import { showToast } from "@/components/ToastProvider";

export function DeleteSaleBtn({ id }: { id: number }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm("CRITICAL WARNING: Are you absolutely sure?\n\nDeleting this sale will automatically RESTORE its inventory back to the correct batches and REMOVE the balance from the customer's total pending loan.\n\nThis cannot be undone!")) {
            return;
        }

        setLoading(true);
        const res = await deleteSale(id);

        if (res.error) {
            showToast("Failed to delete sale: " + res.error, "error");
        } else {
            showToast("Sale natively rollback successful! Inventory restored.", "success");
        }
        setLoading(false);
    };

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            title="Rollback Sale"
            style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: 'var(--error)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.4rem',
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s',
            }}
            onMouseOver={(e) => { if (!loading) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)' }}
            onMouseOut={(e) => { if (!loading) e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)' }}
        >
            <Trash2 size={16} />
        </button>
    );
}
