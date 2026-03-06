import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Helper to load image as base64 on the client
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string | null> => {
    try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result as string);
            };
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Failed to load logo for PDF", e);
        return null;
    }
};

export async function generateCustomerReport(data: any) {
    const { customer, timeline, summary } = data;

    // 1. Initialize Document
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    const logoBase64 = await getBase64ImageFromUrl("/logo.png");
    const stayHighBase64 = await getBase64ImageFromUrl("/stay_high.png");

    const MARGIN = 20;
    const PAGE_WIDTH = doc.internal.pageSize.getWidth();
    const PAGE_HEIGHT = doc.internal.pageSize.getHeight();

    // Official Brand Colors (Emerald/Slate theme matching generateReceipt)
    const PRIMARY_COLOR: [number, number, number] = [16, 185, 129]; // Emerald 500
    const PRIMARY_DARK: [number, number, number] = [4, 120, 87];    // Emerald 700
    const TEXT_MAIN: [number, number, number] = [15, 23, 42];       // Slate 900
    const TEXT_MUTED: [number, number, number] = [100, 116, 139];   // Slate 500

    const todayDateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // ---------------------------------------------------------
    // BACKGROUND WATERMARK
    // ---------------------------------------------------------
    if (logoBase64) {
        doc.setGState(new (doc as any).GState({ opacity: 0.04 }));
        doc.addImage(logoBase64, "PNG", PAGE_WIDTH / 2 - 80, PAGE_HEIGHT / 2 - 80, 160, 160);
        doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
    }

    // ---------------------------------------------------------
    // HEADER (Geometric Emerald Theme)
    // ---------------------------------------------------------

    // Top geometric Accent bar
    doc.setFillColor(...PRIMARY_COLOR);
    doc.rect(0, 0, PAGE_WIDTH, 6, 'F');
    doc.setFillColor(...PRIMARY_DARK);
    doc.rect(0, 6, PAGE_WIDTH * 0.4, 2, 'F');

    let currentY = MARGIN + 10;

    // Header Row Split
    if (logoBase64) {
        doc.addImage(logoBase64, "PNG", MARGIN, currentY - 6, 26, 26);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text("GRAMFLOW", PAGE_WIDTH - MARGIN, currentY + 4, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...TEXT_MUTED);
    doc.text("CUSTOMER LEDGER REPORT", PAGE_WIDTH - MARGIN, currentY + 12, { align: "right" });

    currentY += 30;

    // A crisp divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, currentY, PAGE_WIDTH - MARGIN, currentY);
    currentY += 12;

    // ---------------------------------------------------------
    // CLIENT METADATA
    // ---------------------------------------------------------

    // Left Box: Customer Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_MUTED);
    doc.text("ACCOUNT:", MARGIN, currentY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...TEXT_MAIN);
    doc.text(customer.name.toUpperCase(), MARGIN, currentY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(`Phone: ${customer.phone || 'N/A'}`, MARGIN, currentY + 13);
    doc.text(`Initial Bal: Rs. ${customer.old_loan?.toFixed(2) || '0.00'}`, MARGIN, currentY + 18);

    // Right Box: Document Info
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_MUTED);
    doc.text("GENERATED ON:", PAGE_WIDTH - MARGIN, currentY, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...TEXT_MAIN);
    doc.text(todayDateStr, PAGE_WIDTH - MARGIN, currentY + 7, { align: "right" });

    currentY += 35;

    // ---------------------------------------------------------
    // HISTORY TIMELINE TABLE
    // ---------------------------------------------------------

    const tableBody = timeline.map((item: any) => {
        const d = new Date(item.created_at.replace(' ', 'T') + 'Z');
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });

        let typeStr = item.type === 'sale' ? 'Sale' : 'Payment';
        if (item.type === 'sale' && item.batch_numbers) {
            typeStr += `\n(Batch #${item.batch_numbers})`;
        }

        let gramsStr = item.type === 'sale' ? `${item.grams?.toFixed(2)} g` : '-';
        let billedStr = item.type === 'sale' ? `${item.final_amount?.toFixed(2)}` : '-';
        let rcvdStr = item.amount_received > 0 ? `${item.amount_received?.toFixed(2)}` : '-';
        let balStr = `${item.running_balance?.toFixed(2)}`;

        // Reformat the initial running balance offset by old_loan if needed (backend didn't track old_loan offsets for each row individually nicely, but we can assume total_loan is absolute).

        return [
            item.type === 'sale' ? `S-${item.id}` : `P-${item.id}`,
            dateStr,
            typeStr,
            gramsStr,
            billedStr,
            rcvdStr,
            balStr
        ];
    });

    autoTable(doc, {
        startY: currentY,
        margin: { left: MARGIN, right: MARGIN },
        theme: 'grid',
        headStyles: {
            fillColor: PRIMARY_COLOR,
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 10,
            cellPadding: 5,
        },
        bodyStyles: {
            textColor: TEXT_MAIN,
            fontSize: 9,
            cellPadding: 5,
        },
        // Columns: ID, Date, Type, Grams, Billed, Rcvd, Balance
        columnStyles: {
            0: { fontStyle: 'bold', halign: 'center' }, // ID
            1: { halign: 'center' }, // Date
            2: { halign: 'center', fontStyle: 'italic' }, // Type 
            3: { halign: 'right' },  // Grams
            4: { halign: 'right' },  // Billed
            5: { halign: 'right' },  // Rcvd
            6: { halign: 'right', fontStyle: 'bold' } // Bal
        },
        head: [['ID', 'DATE', 'TYPE', 'GRAMS', 'BILLED (Rs)', 'PAID (Rs)', 'LOAN BAL (Rs)']],
        body: tableBody
    });

    currentY = (doc as any).lastAutoTable.finalY + 15;

    // ---------------------------------------------------------
    // SUMMARY FOOTER & STAY HIGH LOGO
    // ---------------------------------------------------------

    // A thin geometric line above the totals
    doc.setDrawColor(...PRIMARY_COLOR);
    doc.setLineWidth(1);
    doc.line(MARGIN, currentY, PAGE_WIDTH - MARGIN, currentY);
    currentY += 8;

    // Capture the Y coordinate right after the line to start a two-column layout
    const columnsYStart = currentY;

    // --- LEFT COLUMN: Stay High Logo ---
    if (stayHighBase64) {
        // Render it slightly down and constrained to match the height of the totals block
        doc.addImage(stayHighBase64, "PNG", MARGIN, columnsYStart - 5, 50, 50);
    }

    // --- RIGHT COLUMN: Totals Calculation ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(...TEXT_MUTED);
    doc.text("TOTAL CONSUMED:", PAGE_WIDTH - MARGIN - 50, currentY, { align: "right" });
    doc.setTextColor(...TEXT_MAIN);
    doc.text(`${summary.totalGrams.toFixed(2)} g`, PAGE_WIDTH - MARGIN, currentY, { align: "right" });

    currentY += 8;
    doc.setTextColor(...TEXT_MUTED);
    doc.text("TOTAL PAYMENTS:", PAGE_WIDTH - MARGIN - 50, currentY, { align: "right" });
    doc.setTextColor(...TEXT_MAIN);
    doc.text(`Rs. ${summary.totalPayments.toFixed(2)}`, PAGE_WIDTH - MARGIN, currentY, { align: "right" });

    currentY += 10;

    // Large Bold Summary
    doc.setFillColor(241, 253, 244); // Emerald 50
    doc.rect(PAGE_WIDTH / 2, currentY - 6, (PAGE_WIDTH / 2) - MARGIN, 12, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...PRIMARY_DARK);
    doc.text("TOTAL PENDING LOAN:", PAGE_WIDTH - MARGIN - 50, currentY + 2, { align: "right" });
    doc.setFontSize(14);
    doc.text(`Rs. ${summary.finalBalance.toFixed(2)}`, PAGE_WIDTH - MARGIN - 2, currentY + 2, { align: "right" });


    // ---------------------------------------------------------
    // SIGNATURE & FOOTER MESSAGE
    // ---------------------------------------------------------

    // Push the signature block down past the totals and logo
    currentY = Math.max(currentY + 25, columnsYStart + 50);

    // Approved Stamp/Sign Area (Right side)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text("APPROVED", PAGE_WIDTH - MARGIN - 30, currentY - 5, { align: "center" });

    doc.setDrawColor(...TEXT_MAIN);
    doc.setLineWidth(0.5);
    doc.line(PAGE_WIDTH - MARGIN - 60, currentY + 2, PAGE_WIDTH - MARGIN, currentY + 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_MUTED);
    doc.text("Authorized Signature", PAGE_WIDTH - MARGIN - 30, currentY + 7, { align: "center" });

    // ---------------------------------------------------------
    // FOOTER REPEATER
    // ---------------------------------------------------------
    const totalPages = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text(`Page ${i} of ${totalPages} - Generated system report`, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: "center" });
    }

    // ---------------------------------------------------------
    // EXPORT
    // ---------------------------------------------------------
    const safeCustomerName = customer.name.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Customer_Ledger_${safeCustomerName}_${todayDateStr.replace(/[^a-zA-Z0-9]/g, '')}.pdf`);
}
