import prisma from '../src/config/database';
import { generateApiCredentials } from '../src/utils/encryption';
import { logger } from '../src/utils/logger';

async function seed() {
    logger.info('🌱 Starting database seed...');

    try {
        // Create a demo project
        const { apiKey, apiSecret, hashedSecret } = generateApiCredentials();

        const project = await prisma.project.create({
            data: {
                name: 'Demo Project',
                slug: 'demo-project',
                description: 'Demo project for testing authentication',
                apiKey,
                apiSecret: hashedSecret,
                isActive: true,
                allowedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
            },
        });

        logger.info(`✅ Demo project created:`);
        logger.info(`   Name: ${project.name}`);
        logger.info(`   API Key: ${apiKey}`);
        logger.info(`   API Secret: ${apiSecret}`);
        logger.info(`   ⚠️  Save these credentials - the secret won't be shown again!`);

        logger.info('🎉 Database seeded successfully!');
    } catch (error) {
        logger.error('❌ Error seeding database:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seed()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
