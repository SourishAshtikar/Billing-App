export default {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  migrations: {
    seed: 'tsx ./prisma/seed.ts',
  },
};
