<template>
<transition name="slide-fade-top">
  <div class="quick-node-panel" v-if="quickNodePanelVisible"
    v-global-click="globalClick"
    :style="style">
    <form-input v-model="searchText" placeholder="Search for nodes"
      @input="onSearchTextInput"></form-input>
    <node-list class="node-list"
      :nodeTypes="filteredNodeTypes"
      :nodeTypesPerRow="4"
      :createNodeAtMouseOnClick="true"
      @nodeCreated="closeQuickNodePanel"
    ></node-list>
  </div>
</transition>
</template>

<style lang="scss" src="./quick-node-panel.scss"></style>

<script lang="ts" src="./quick-node-panel.ts">
</script>
