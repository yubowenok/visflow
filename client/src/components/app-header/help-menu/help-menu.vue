<template>
<div>
  <b-nav-item-dropdown text="Help">
    <b-dropdown-item @click="documentation"><i class="fas fa-sm fa-book"></i>Documentation</b-dropdown-item>
    <b-dropdown-item @click="crashReport"><i class="fas fa-exclamation-triangle"></i>Crash Report</b-dropdown-item>
    <b-dropdown-item @click="issues"><i class="fas fa-sm fa-pencil-alt"></i>Issues</b-dropdown-item>
    <b-dropdown-item @click="about"><i class="fas fa-sm fa-info-circle"></i>About</b-dropdown-item>
  </b-nav-item-dropdown>
  <b-modal :title="`About VisFlow (v${version})`" v-model="aboutModalVisible">
    <div><span class="bold">VisFlow:</span> Web-based Dataflow Framework for Visual Data Exploration</div>
    <div class="section">
      <div class="bold">Publication:</div>
      <div>
        Bowen Yu, and Claudio T. Silva.
        <i>VisFlow - Web-based Visualization Framework for Tabular Data with a Subset Flow Model.</i>
        In IEEE Transactions on Visualization and Computer Graphics (Proc. VAST), 2017.
        <a href="https://ieeexplore.ieee.org/document/7536189/" target="_blank" class="bold">IEEEXplore</a>
      </div>
    </div>
    <div class="section links">
      <b-button variant="outline-secondary" @click="documentation"><i class="fas fa-book"></i></b-button>
      <b-button variant="outline-secondary" @click="github"><i class="fab fa-github"></i></b-button>
    </div>
    <div slot="modal-footer">
      <div class="float-right">
        <b-btn variant="outline-secondary" @click="closeAbout">OK</b-btn>
      </div>
    </div>
  </b-modal>
</div>
</template>

<style scoped lang="scss">
@import '../../../common/style/index';
.links {
  button {
    font-size: 1.25rem;
  }
}
</style>

<script lang="ts" src="./help-menu.ts">
</script>
