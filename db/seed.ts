import { convertFileToBase64 } from "@configs/fileUpload";
import { faker } from "@faker-js/faker";
import models from "@models";

const seedProduct = async () => {
  const data = [];
  for (let i = 0; i < 1000; i++) {
    const imageSrc = {
      path: `E:/Hoan/iViettech/M47/irwin-framework/app/assets/images/img/portfolio/${
        Math.floor(Math.random() * 6) + 1
      }.jpg`,
    } as Express.Multer.File;
    const image = convertFileToBase64(imageSrc, false);

    data.push({
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      price: faker.commerce.price(),
      image,
      categoryId: 5,
    });
  }

  await models.product.bulkCreate(data);
};

seedProduct();
