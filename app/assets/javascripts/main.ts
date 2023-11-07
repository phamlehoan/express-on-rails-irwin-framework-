var Vue = require("vue/dist/vue.js");

Vue.component("hoan", require("./components/hoan.vue"));

const app = new Vue({
  el: "#app",
});
