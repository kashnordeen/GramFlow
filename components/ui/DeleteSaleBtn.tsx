"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { deleteSale } from "@/lib/actions/sale.actions";
import { showToast } from "@/components/ToastProvider";
import { useAccess } from "@/components/AccessProvider";

export function DeleteSaleBtn({ id }: { id: number }) {
    const { hasPermission } = useAccess();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Reverse this sale?\n\nThis restores the exact stock batches, updates the customer balance, and posts immutable reversal journals.")) {
            return;
        }

        setLoading(true);
        const res = await deleteSale(id);

        if (res.error) {
            showToast("Failed to reverse sale: " + res.error, "error");
        } else {
            showToast("Sale reversed successfully. Stock and accounting were restored.", "success");
        }
        setLoading(false);
    };

    if (!hasPermission("sales.reverse")) return null;
    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            title="Reverse Sale"
            className="action-icon-btn danger"
            style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
            <RotateCcw size={15} />
        </button>
    );
}
