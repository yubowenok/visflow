<template>
<router-link :to="link">
  <span class="page-link">{{ text }}</span>
</router-link>
</template>

<script>
export default {
  props: {
    link: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
}
</script>

<style scoped lang="stylus">
</style>
