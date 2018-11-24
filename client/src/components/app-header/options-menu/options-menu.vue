<template>
<b-nav-item-dropdown text="Options">
  <b-dropdown-item @click="toggleNodePanel" :disabled="isSystemInVisMode">
    <i :class="['far fa-sm', nodePanelVisible && !isSystemInVisMode ? 'fa-check-square' : 'fa-square']"></i>
    Node Panel
  </b-dropdown-item>
  <b-dropdown-item @click="toggleHistoryPanel">
    <i :class="['far fa-sm', historyPanelVisible ? 'fa-check-square' :  'fa-square']"></i>
    History Panel
  </b-dropdown-item>
  <b-dropdown-item @click="toggleNodeLabels">
    <i :class="['far fa-sm', !nodeLabelsVisible ? 'fa-check-square' :  'fa-square']"></i>
    Hide Node Labels
  </b-dropdown-item>
  <b-dropdown-item @click="labelAllNodes">
    <i class="fas placeholder"></i>
    Label all nodes
  </b-dropdown-item>
  <template v-if="!isInExperiment">
  <b-dropdown-divider></b-dropdown-divider>
  <b-dropdown-header>Beta Features</b-dropdown-header>
  <b-dropdown-item @click="toggleBetaFeatures">
    <i :class="['far fa-sm', useBetaFeatures ? 'fa-check-square' :  'fa-square']"></i>
    Enable Beta Features
  </b-dropdown-item>
  <b-dropdown-item @click="toggleDataMutationBoundary" v-if="useBetaFeatures">
    <i :class="['far fa-sm', dataMutationBoundaryVisible ? 'fa-check-square' :  'fa-square']"></i>
    Data Mutation Boundary
  </b-dropdown-item>
  </template>
</b-nav-item-dropdown>
</template>

<script lang="ts" src="./options-menu.ts">
</script>
