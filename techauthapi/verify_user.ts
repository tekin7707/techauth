import 'dotenv/config';
import prisma from './src/config/database';

async function verify() {
    try {
        const email = 'tekin7707@gmail.com';
        const user = await prisma.user.update({
            where: { email },
            data: { emailVerified: true },
        });
        console.log(`Successfully verified user: ${user.email}`);
    } catch (e) {
        console.error('Error verifying user:', e);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
