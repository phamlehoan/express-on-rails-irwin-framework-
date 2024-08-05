import organizationModel, { organization } from "./organization";
import userModel, { user } from "./user";
import userOrganizationModel, { userOrganization } from "./userOrganization";

organizationModel.associate();
userModel.associate();
userOrganizationModel.associate();

export default {
  organization,
  user,
  userOrganization,
};
