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

export async function generateReceipt(sale: any) {
    // 1. Initialize Document
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4" // Upgraded to A4 for the official certificate look
    });

    const logoBase64 = await getBase64ImageFromUrl("/logo.png");

    const MARGIN = 20;
    const PAGE_WIDTH = doc.internal.pageSize.getWidth();
    const PAGE_HEIGHT = doc.internal.pageSize.getHeight();

    // Official Colors
    const PRIMARY_COLOR: [number, number, number] = [16, 185, 129]; // Emerald 500
    const TEXT_MAIN: [number, number, number] = [15, 23, 42]; // Slate 900
    const TEXT_MUTED: [number, number, number] = [100, 116, 139]; // Slate 500

    // Dates
    const d = new Date(sale.created_at.replace(' ', 'T') + 'Z');
    const dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Admin
    let adminInitial = "A";
    let displayComments = sale.comments || "-";
    if (sale.comments && sale.comments.includes('||ADMIN||')) {
        const tagRegex = /\|\|ADMIN\|\|(.*?)\|\|/;
        const match = sale.comments.match(tagRegex);
        if (match && match[1]) {
            adminInitial = match[1].charAt(0).toUpperCase();
        }
        displayComments = sale.comments.replace(tagRegex, '').trim() || "-";
    }

    // ---------------------------------------------------------
    // BACKGROUND WATERMARK
    // ---------------------------------------------------------
    if (logoBase64) {
        doc.setGState(new (doc as any).GState({ opacity: 0.04 }));
        // Center a massive watermark
        doc.addImage(logoBase64, "PNG", PAGE_WIDTH / 2 - 80, PAGE_HEIGHT / 2 - 80, 160, 160);
        doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
    }

    // ---------------------------------------------------------
    // HEADER (Official Branding)
    // ---------------------------------------------------------
    let currentY = MARGIN + 10;
    if (logoBase64) {
        doc.addImage(logoBase64, "PNG", MARGIN, MARGIN, 24, 24);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text("GRAMFLOW", PAGE_WIDTH - MARGIN, currentY, { align: "right" });

    currentY += 8;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text("OFFICIAL TRANSACTION RECORD", PAGE_WIDTH - MARGIN, currentY, { align: "right" });

    currentY += 15;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, currentY, PAGE_WIDTH - MARGIN, currentY);
    currentY += 15;

    // ---------------------------------------------------------
    // METADATA GRID
    // ---------------------------------------------------------
    doc.setFontSize(10);

    // Left Column
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_MUTED);
    doc.text("BILLED TO:", MARGIN, currentY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...TEXT_MAIN);
    doc.text(sale.customer_name, MARGIN, currentY + 8);

    // Right Column
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_MUTED);
    doc.text("RECEIPT NO:", PAGE_WIDTH / 2 + 10, currentY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_MAIN);
    doc.text(`GF-INV-${sale.id.toString().padStart(5, '0')}`, PAGE_WIDTH / 2 + 50, currentY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_MUTED);
    doc.text("DATE:", PAGE_WIDTH / 2 + 10, currentY + 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_MAIN);
    doc.text(dateStr, PAGE_WIDTH / 2 + 50, currentY + 8);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT_MUTED);
    doc.text("TIME:", PAGE_WIDTH / 2 + 10, currentY + 16);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_MAIN);
    doc.text(timeStr, PAGE_WIDTH / 2 + 50, currentY + 16);

    currentY += 30;

    // ---------------------------------------------------------
    // FINANCIAL SUMMARY TABLE
    // ---------------------------------------------------------
    const isLoan = sale.balance > 0;

    autoTable(doc, {
        startY: currentY,
        margin: { left: MARGIN, right: MARGIN },
        theme: 'grid',
        headStyles: {
            fillColor: PRIMARY_COLOR,
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 11,
            cellPadding: 6,
        },
        bodyStyles: {
            textColor: TEXT_MAIN,
            fontSize: 11,
            cellPadding: 6,
        },
        columnStyles: {
            0: { fontStyle: 'bold' },
            1: { halign: 'right', font: 'courier' }
        },
        head: [['Financial Breakdown', 'Amount']],
        body: [
            ['Total Weight Delivered', `${sale.grams_sold?.toFixed(2)} g`],
            ['Gross Valuation', `Rs. ${sale.gross_amount?.toFixed(2)}`],
            ['Discount Allocation', `- Rs. ${sale.discount?.toFixed(2)}`],
            ['Final Payable Valuation', `Rs. ${sale.final_amount?.toFixed(2)}`],
            ['Payment Secured', `Rs. ${sale.amount_received?.toFixed(2)}`],
        ]
    });

    currentY = (doc as any).lastAutoTable.finalY;

    // Balance Highlight row
    doc.setFillColor(isLoan ? 254 : 240, isLoan ? 242 : 253, isLoan ? 242 : 244); // Red-50 or Emerald-50
    doc.rect(MARGIN, currentY, PAGE_WIDTH - MARGIN * 2, 12, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    if (isLoan) {
        doc.setTextColor(220, 38, 38); // Red 600
        doc.text("OUTSTANDING LOAN BALANCE:", MARGIN + 4, currentY + 8);
        doc.text(`Rs. ${sale.balance?.toFixed(2)}`, PAGE_WIDTH - MARGIN - 4, currentY + 8, { align: 'right' });
    } else {
        doc.setTextColor(...PRIMARY_COLOR);
        doc.text("ACCOUNT STATUS:", MARGIN + 4, currentY + 8);
        doc.text("FULLY PAID", PAGE_WIDTH - MARGIN - 4, currentY + 8, { align: 'right' });
    }

    currentY += 24;

    // ---------------------------------------------------------
    // BATCH ALLOCATION HISTORY (The requested feature)
    // ---------------------------------------------------------
    if (sale.batchesDeducted && sale.batchesDeducted.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(...TEXT_MAIN);
        doc.text("Product Origin & Batch Allocation", MARGIN, currentY);
        currentY += 6;

        const batchBody = sale.batchesDeducted.map((b: any) => [
            `Stock Batch #${b.batch_id}`,
            `${Number(b.grams_deducted).toFixed(2)} g`
        ]);

        autoTable(doc, {
            startY: currentY,
            margin: { left: MARGIN, right: MARGIN },
            theme: 'plain',
            headStyles: {
                fillColor: [241, 245, 249], // Slate 100
                textColor: TEXT_MUTED,
                fontStyle: 'bold',
                fontSize: 10,
                cellPadding: 4,
            },
            bodyStyles: {
                textColor: TEXT_MAIN,
                fontSize: 10,
                cellPadding: 4,
                lineColor: [226, 232, 240], // Slate 200
                lineWidth: { bottom: 0.1 }
            },
            columnStyles: {
                0: { fontStyle: 'normal' },
                1: { halign: 'right', font: 'courier' }
            },
            head: [['Source Identification', 'Grams Deducted']],
            body: batchBody
        });

        currentY = (doc as any).lastAutoTable.finalY + 12;
    }

    // ---------------------------------------------------------
    // COMMENTS
    // ---------------------------------------------------------
    if (displayComments !== "-") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...TEXT_MUTED);
        doc.text("Transaction Notes:", MARGIN, currentY);

        currentY += 6;
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...TEXT_MAIN);
        const splitComments = doc.splitTextToSize(displayComments, PAGE_WIDTH - MARGIN * 2);
        doc.text(splitComments, MARGIN, currentY);
        currentY += splitComments.length * 5;
    }

    // ---------------------------------------------------------
    // FOOTER
    // ---------------------------------------------------------
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, PAGE_HEIGHT - 35, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 35);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text("Thank you for choosing GramFlow.", PAGE_WIDTH / 2, PAGE_HEIGHT - 25, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...TEXT_MUTED);
    doc.text("This is a system generated document and requires no physical signature.", PAGE_WIDTH / 2, PAGE_HEIGHT - 18, { align: "center" });

    // Auth Footprint
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225); // Slate 300
    doc.text(`AUTH_KEY: GF-${sale.id}-ADM-${adminInitial}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 10, { align: "center" });

    // ---------------------------------------------------------
    // EXPORT
    // ---------------------------------------------------------
    const safeCustomerName = sale.customer_name.replace(/[^a-zA-Z0-9]/g, '_');
    const safeDate = dateStr.replace(/[^a-zA-Z0-9]/g, '');
    doc.save(`Official_Receipt_${safeCustomerName}_${safeDate}.pdf`);
}
