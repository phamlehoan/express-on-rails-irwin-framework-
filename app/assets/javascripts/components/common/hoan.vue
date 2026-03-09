<template>
  <div class="hoan">
    Author:
    <span>{{ who }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Hoan',
  data() {
    return {
      who: 'Hoan Pham (Peter)',
    };
  },
  mounted() {
    setTimeout(() => {
      console.log('We can use ES6 too!');
    }, 1000);
  },
});
</script>

<style scoped>
.hoan {
  color: green;
}
</style>
