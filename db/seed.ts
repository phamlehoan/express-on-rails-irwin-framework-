import models from "@models";

async function seed() {
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
