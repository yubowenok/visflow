<template>
<div class="user-bar">
  <div v-if="username">
    <i class="fas fa-user"></i>
    {{ username }}
  </div>
  <button v-if="!username"
    @click="loginClicked"
    class="btn btn-outline-success"
  >
    Login
  </button>
</div>
</template>

<style scoped src="./user-bar.scss"></style>

<script src="./user-bar.ts">
</script>
