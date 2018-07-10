<template>
<base-modal ref="modal" title="Profile"
  :visible-state="profileModalVisible"
  :on-open="openProfileModal"
  :on-close="closeProfileModal"
  >
  <template slot="content">
    Profile is coming soon.
  </template>
  <template slot="footer">
    <b-btn class="float-right" variant="outline-secondary" @click="$refs.modal.close()">OK</b-btn>
  </template>
</base-modal>
</template>

<script src="./profile-modal.ts">
</script>
