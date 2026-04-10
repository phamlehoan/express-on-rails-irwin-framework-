import models from "@models";
import { seedFeatures } from "./seeders/features";
import { seedAdminUser } from "./seeders/seedAdminUser";

async function seed() {
  await seedFeatures();
  await seedAdminUser();
  console.log("Seed data created successfully!");
}
seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await models.$disconnect();
  });
