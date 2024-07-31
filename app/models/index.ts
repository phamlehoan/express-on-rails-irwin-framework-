import { dbConfig } from "@configs/database";
import { Sequelize } from "sequelize";

const sequelize = new Sequelize(dbConfig.development);

export { Sequelize, sequelize };
