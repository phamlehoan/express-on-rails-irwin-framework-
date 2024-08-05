import sequelize from "@configs/database";
import { Sequelize } from "sequelize";
import { user } from "./user";
import { userOrganization } from "./userOrganization";

export interface OrganizationAttributes {
  name?: string;
  description?: string;
}

export interface OrganizationInstance {
  id: number;
  createdAt: Date;
  updatedAt: Date;

  name: string;
  description: string;
}

export const organization = sequelize.define("Organization", {
  name: Sequelize.STRING,
  description: Sequelize.STRING,
});

export const associate = () => {
  organization.hasMany(userOrganization, {
    foreignKey: "organizationId",
  });
  organization.belongsToMany(user, {
    through: userOrganization,
    foreignKey: "organizationId",
  });
};

export default { Organization: organization, associate };
