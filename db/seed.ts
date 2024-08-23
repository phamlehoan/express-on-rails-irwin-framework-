import models from "@models";

const seedProduct = async () => {
  const data = [];
  for (let i = 2; i < 9; i++) {
    data.push({
      productId: Number("102" + i),
      userId: 1,
      quantity: 3,
    });
  }

  await models.cart.bulkCreate(data);
};

seedProduct();
