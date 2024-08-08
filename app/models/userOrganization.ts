import sequelize from "@configs/database";
import { Sequelize } from "sequelize";
import { organization } from "./organization";
import { user } from "./user";

export interface UserOrganizationAttributes {
  organizationId?: number;
  userId?: number;
}

export interface UserOrganizationInstance {
  id: number;
  createdAt: Date;
  updatedAt: Date;

  organizationId: number;
  userId: number;
}

export const userOrganization = sequelize.define("UserOrganization", {
  organizationId: {
    type: Sequelize.INTEGER,
    references: {
      model: "Organization",
      key: "id",
    },
  },
  userId: {
    type: Sequelize.INTEGER,
    references: {
      model: "User",
      key: "id",
    },
  },
});

export const associate = () => {
  userOrganization.belongsTo(user, { foreignKey: "userId" });
  userOrganization.belongsTo(organization, {
    foreignKey: "organizationId",
  });
};

export default { UserOrganization: userOrganization, associate };
