<template>
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
      <user-bar></user-bar>
    </b-navbar-nav>
  </b-collapse>
  <!--
  <a class="btn btn-outline-primary" href="#">Sign up</a>
  -->
</nav>
</template>

<style scoped src="./app-header.scss"></style>

<script src="./app-header.ts">
</script>
