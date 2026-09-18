"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteCustomer } from "@/lib/actions/customer.actions";
import { showToast } from "@/components/ToastProvider";
import { useAccess } from "@/components/AccessProvider";

export function DeleteCustomerBtn({ id }: { id: number }) {
    const { hasPermission } = useAccess();
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this customer? Deducted stock will be restored to inventory.")) {
            return;
        }

        setLoading(true);
        const res = await deleteCustomer(id);

        if (res.error) {
            showToast(res.error, "error");
        } else {
            showToast("Customer record deleted and inventory restored.", "success");
        }
        setLoading(false);
    };

    if (!hasPermission("customers.delete")) return null;
    return (
        <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            title="Delete Customer Profile"
            className="action-icon-btn danger"
            style={{ opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        >
            <Trash2 size={15} />
        </button>
    );
}
