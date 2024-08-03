import { Sequelize } from "sequelize";
import * as dbConfig from "./config.json";

export default new Sequelize(
  dbConfig[(process.env.NODE_ENV as keyof typeof dbConfig) || "development"]
);
