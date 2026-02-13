import 'dotenv/config';
import prisma from './src/config/database';

async function promoteToGlobalAdmin(email: string) {
    if (!email) {
        console.error('Please provide an email address');
        process.exit(1);
    }

    try {
        const user = await prisma.user.update({
            where: { email },
            data: { isGlobalAdmin: true },
        });
        console.log(`Successfully promoted user to Global Admin: ${user.email}`);
    } catch (e) {
        console.error('Error promoting user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

const email = process.argv[2];
promoteToGlobalAdmin(email);
