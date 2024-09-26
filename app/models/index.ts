import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'stdout', level: 'error' },
    { emit: 'stdout', level: 'info' },
    { emit: 'stdout', level: 'warn' },
  ],
  errorFormat: 'colorless',
});

prisma.$on('query', (e: Prisma.QueryEvent) => {
  console.info('Query: ' + e.query);
  console.info('Params: ' + e.params);
  console.info('Duration: ' + e.duration + 'ms');
  console.info('\n');
});

export default prisma;
