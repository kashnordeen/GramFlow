"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteStockBatch } from "@/lib/actions/stock.actions";
import { showToast } from "@/components/ToastProvider";
import { useAccess } from "@/components/AccessProvider";

export function DeleteBatchBtn({ id }: { id: number }) {
    const { hasPermission } = useAccess();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this unused stock batch?")) {
            return;
        }

        setLoading(true);
        const res = await deleteStockBatch(id);

        if (res.error) {
            showToast("Failed to delete batch: " + res.error, "error");
        } else {
            showToast("Stock batch removed from vault.", "success");
        }
        setLoading(false);
    };

    if (!hasPermission("inventory.delete")) return null;
    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            title="Delete Stock Batch"
            className="action-icon-btn danger"
            style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
            <Trash2 size={15} />
        </button>
    );
}
