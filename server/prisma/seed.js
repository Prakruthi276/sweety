const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const SLOTS = ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'];

async function main() {
  const passwordHash = await bcrypt.hash('Demo1234', 10);
  const user = await prisma.user.upsert({
    where: { email: 'demo@sweety.app' },
    update: {},
    create: { name: 'Demo Patient', email: 'demo@sweety.app', passwordHash },
  });

  const data = [];
  for (let i = 1; i <= 60; i++) { // starts at yesterday, so never a future date
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - i);
    const slotsThatDay = i % 5 === 0 ? 2 : 4;
    SLOTS.slice(0, slotsThatDay).forEach((slot, s) => {
      data.push({ userId: user.id, date, slot, value: 80 + ((i * 37 + s * 29) % 110) });
    });
  }
  const { count } = await prisma.reading.createMany({ data, skipDuplicates: true });

  console.log(`Seeded ${user.email} / Demo1234 with ${count} new readings`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
