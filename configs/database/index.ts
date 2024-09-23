import env from "@configs/env";
import { Sequelize } from "sequelize";
import * as dbConfig from "./config.json";

export default new Sequelize(
  dbConfig[(env.nodeEnv as keyof typeof dbConfig) || "development"]
);
