<template>
<div>
  <nav class="app-header navbar navbar-expand-sm navbar-light bg-white border-bottom">
    <a id="logo" class="navbar-brand">
      <img src="@/imgs/logo.png">
      <span class="vis">Vis</span>
      <span class="flow">Flow</span>
    </a>
    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
    <b-collapse is-nav id="nav-collapse">
      <b-navbar-nav>
        <diagram-menu></diagram-menu>
      </b-navbar-nav>
      <b-navbar-nav>
        <edit-menu></edit-menu>
      </b-navbar-nav>
      <b-navbar-nav>
        <options-menu></options-menu>
      </b-navbar-nav>
      <b-navbar-nav>
        <help-menu></help-menu>
      </b-navbar-nav>
      <b-navbar-nav class="ml-auto">
        <!-- tool bars -->
        <drag-bar></drag-bar>
        <dataset-bar></dataset-bar>

        <user-bar></user-bar>
      </b-navbar-nav>
    </b-collapse>
  </nav>
  <div class="modals">
    <new-diagram-modal></new-diagram-modal>
    <load-diagram-modal></load-diagram-modal>
    <save-as-diagram-modal></save-as-diagram-modal>
    <login-modal></login-modal>
    <signup-modal></signup-modal>
    <profile-modal></profile-modal>
  </div>
</div>

</template>

<style scoped src="./app-header.scss"></style>

<script lang="ts" src="./app-header.ts">
</script>
