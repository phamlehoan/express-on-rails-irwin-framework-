import sequelize from "@configs/database";
import { Sequelize } from "sequelize";
import { organization } from "./organization";
import { userOrganization } from "./userOrganization";

export interface UserAttributes {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface UserInstance {
  id: number;
  createdAt: Date;
  updatedAt: Date;

  firstName: string;
  lastName: string;
  email: string;
}

export const user = sequelize.define("User", {
  firstName: Sequelize.STRING,
  lastName: Sequelize.STRING,
  email: Sequelize.STRING,
});

export const associate = () => {
  user.hasMany(userOrganization, {
    foreignKey: "userId",
  });
  user.belongsToMany(organization, {
    through: userOrganization,
    foreignKey: "userId",
  });
};

export default { User: user, associate };
