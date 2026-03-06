"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteStockBatch } from "@/lib/actions/stock.actions";
import { showToast } from "@/components/ToastProvider";

export function DeleteBatchBtn({ id }: { id: number }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to permanently erase this complete Stock Batch entry?")) {
            return;
        }

        setLoading(true);
        const res = await deleteStockBatch(id);

        if (res.error) {
            showToast(res.error, "error");
        } else {
            showToast("Stock batch permanently removed.", "success");
        }
        setLoading(false);
    };

    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            title="Erase Batch"
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
