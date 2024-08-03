import { dbConfig } from "@configs/database";
import { Sequelize } from "sequelize";
import userModel from "./user";


const sequelize =new Sequelize(dbConfig.development);

export default{
   user: userModel(sequelize, Sequelize) 
} 
