import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/actions/auth.actions';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
    const user = await getSessionUser();

    if (!user) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const dbPath = path.join(process.cwd(), 'inventory.db');

        if (!fs.existsSync(dbPath)) {
            return new Response("Database not found", { status: 404 });
        }

        const stats = fs.statSync(dbPath);

        // Use standard Web Stream API to read file chunk by chunk (memory efficient)
        const stream = new ReadableStream({
            start(controller) {
                const reader = fs.createReadStream(dbPath);

                reader.on('data', (chunk) => {
                    controller.enqueue(chunk);
                });

                reader.on('end', () => {
                    controller.close();
                });

                reader.on('error', (err) => {
                    controller.error(err);
                });
            }
        });

        // Format: gramflow-backup-YYYY-MM-DD.db
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `gramflow-backup-${dateStr}.db`;

        return new Response(stream, {
            headers: {
                'Content-Type': 'application/x-sqlite3',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': stats.size.toString(),
            },
        });

    } catch (error) {
        console.error("Backup generation failed:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}
