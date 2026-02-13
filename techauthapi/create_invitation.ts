import 'dotenv/config';
import prisma from './src/config/database';
import { randomBytes } from 'crypto';

async function generateInvitation(email: string) {
    if (!email) {
        console.error('Please provide creator email (admin)');
        process.exit(1);
    }

    try {
        const admin = await prisma.user.findUnique({
            where: { email },
        });

        if (!admin || !admin.isGlobalAdmin) {
            console.error('User is not found or not a global admin');
            process.exit(1);
        }

        const key = randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 3);

        const invitation = await prisma.projectInvitation.create({
            data: {
                key,
                expiresAt,
                createdById: admin.id,
                description: 'Generated via CLI script',
            },
        });

        console.log(`\nInvitation Created Successfully!`);
        console.log(`Key: ${invitation.key}`);
        console.log(`Expires At: ${invitation.expiresAt}`);
        console.log(`\nUse this key to create a new project via POST /api/projects`);
    } catch (e) {
        console.error('Error creating invitation:', e);
    } finally {
        await prisma.$disconnect();
    }
}

const email = process.argv[2];
generateInvitation(email);
