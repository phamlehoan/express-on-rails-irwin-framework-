import { createApp } from "vue";
import FeatureDetail from "./components/admin/FeatureDetail.vue";
import ProfileDetail from "./components/admin/ProfileDetail.vue";
import UserDetail from "./components/admin/UserDetail.vue";
import { getI18n } from "./i18n";

const i18n = getI18n();

// Mount Vue khi có container cần thiết
const userDetailEl = document.getElementById("userDetailApp");
if (userDetailEl) {
  const dataEl = document.getElementById("userData");
  const data = JSON.parse(dataEl ? dataEl.textContent || "{}" : "{}");
  const { targetUser = {}, roles = [], features = [] } = data;
  const app = createApp(UserDetail, { targetUser, roles, features });
  app.provide("t", i18n.t);
  app.mount("#userDetailApp");
}

const featureDetailEl = document.getElementById("featureDetailApp");
if (featureDetailEl) {
  const dataEl = document.getElementById("featureData");
  const data = JSON.parse(dataEl ? dataEl.textContent || "{}" : "{}");
  const { feature = {}, features = [] } = data;
  const app = createApp(FeatureDetail, { feature, features });
  app.provide("t", i18n.t);
  app.mount("#featureDetailApp");
}

const profileDetailEl = document.getElementById("adminProfileApp");
if (profileDetailEl) {
  const dataEl = document.getElementById("adminProfileData");
  const data = JSON.parse(dataEl ? dataEl.textContent || "{}" : "{}");
  const { currentUser = {}, roles = [] } = data;
  const app = createApp(ProfileDetail, { currentUser, roles });
  app.provide("t", i18n.t);
  app.mount("#adminProfileApp");
}
