<template>
<base-modal ref="modal" title="Profile"
  :visible-state="profileModalVisible"
  :on-open="openProfileModal"
  :on-close="closeProfileModal"
  >
  <template slot="content">
    <div class="section">
      <div><span class="bold">User: </span>{{userInfo.username}}</div>
      <div><span class="bold">Email: </span>{{userInfo.email}}</div>
      <div><span class="bold">Number of Datasets: </span>{{datasetList.length}}</div>
      <div><span class="bold">Number of Diagrams: </span>{{!diagramList ? 'N/A' : diagramList.length}}</div>
    </div>
    <div class="section">
      <b-button variant="outline-secondary" @click="changePassword">Change Password</b-button>
    </div>
  </template>
  <template slot="footer">
    <b-btn class="float-right" variant="outline-secondary" @click="$refs.modal.close()">OK</b-btn>
  </template>
</base-modal>
</template>

<script lang="ts" src="./profile-modal.ts">
</script>
