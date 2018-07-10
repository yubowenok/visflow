<template>
<base-modal ref="modal" title="Signup New User"
  :visible-state="signupModalVisible"
  :on-open="openSignupModal"
  :on-close="closeSignupModal"
  :on-enter="signup"
  >
  <template slot="content">
    <b-container fluid>
      <b-row>
        <b-col sm="4" class="input-label">Username</b-col>
        <b-col sm="8"><b-form-input type="text" v-model="signupUsername"></b-form-input></b-col>
      </b-row>
      <b-row>
        <b-col sm="4" class="input-label">Password</b-col>
        <b-col sm="8"><b-form-input type="password" v-model="signupPassword"></b-form-input></b-col>
      </b-row>
      <b-row>
        <b-col sm="4" class="input-label">Confirm Password</b-col>
        <b-col sm="8"><b-form-input type="password" v-model="signupConfirmPassword"></b-form-input></b-col>
      </b-row>
      <b-row>
        <b-col sm="4" class="input-label">Email</b-col>
        <b-col sm="8"><b-form-input type="email" v-model="signupEmail"></b-form-input></b-col>
      </b-row>
    </b-container>
  </template>
  <template slot="footer">
    <b-btn class="float-right" variant="outline-success" @click="signup">Submit</b-btn>
    <b-btn class="float-right" variant="outline-secondary" @click="$refs.modal.close()">Cancel</b-btn>
  </template>
</base-modal>
</template>

<script src="./signup-modal.ts">
</script>
