<template>
<base-modal ref="modal" title="Change Password"
  :visible-state="passwordModalVisible"
  :on-open="openPasswordModal"
  :on-close="closePasswordModal"
  :on-enter="changePassword"
  >
  <template slot="content">
    <b-container fluid>
      <b-row>
        <b-col sm="4" class="input-label">Current Password</b-col>
        <b-col sm="8"><b-form-input type="password" v-model="password"></b-form-input></b-col>
      </b-row>
      <b-row>
        <b-col sm="4" class="input-label">New Password</b-col>
        <b-col sm="8"><b-form-input type="password" v-model="newPassword"></b-form-input></b-col>
      </b-row>
      <b-row>
        <b-col sm="4" class="input-label">Confirm Password</b-col>
        <b-col sm="8"><b-form-input type="password" v-model="confirmNewPassword"></b-form-input></b-col>
      </b-row>
    </b-container>
  </template>
  <template slot="footer">
    <b-btn class="float-right" variant="outline-success" @click="changePassword">Submit</b-btn>
    <b-btn class="float-right" variant="outline-secondary" @click="$refs.modal.close()">Cancel</b-btn>
  </template>
</base-modal>
</template>

<script lang="ts" src="./password-modal.ts">
</script>
