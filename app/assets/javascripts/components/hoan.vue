<template>
  <div class="hoan">
      Author: 
      <span>{{ who }}</span>
  </div>
</template>

<script lang="ts">
module.exports = {
  data () {
      return {
          who: "Hoan Pham (Peter)"
      }
  },
  mounted () {
      setTimeout(() => {
          console.log('We can use ES6 too!')
      }, 1000)
  }
}
</script>

<style scoped lang="scss">
.hoan {
  color: green;
}
</style>