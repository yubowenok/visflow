<template>
<div class="user-bar">
  <div v-if="username" class="username">
    <span @click="openProfileModal">
      <i class="fas fa-user"></i>
      {{ username }}
    </span>
    <i class="logout fas fa-sign-out-alt" @click="logout"></i>
  </div>
  <button v-if="!username"
    @click="openLoginModal"
    class="btn btn-outline-success"
  >
    Login
  </button>
</div>
</template>

<style scoped lang="scss" src="./user-bar.scss"></style>

<script lang="ts" src="./user-bar.ts">
</script>
