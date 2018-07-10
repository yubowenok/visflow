<template>
<base-modal ref="modal" title="Login"
  :visible-state="loginModalVisible"
  :on-open="openLoginModal"
  :on-close="closeLoginModal"
  :on-enter="login"
  >
  <template slot="content">
    <b-container fluid>
      <b-row>
        <b-col sm="3" class="input-label">Username</b-col>
        <b-col sm="9"><b-form-input type="text" v-model="loginUsername"></b-form-input></b-col>
      </b-row>
      <b-row>
        <b-col sm="3" class="input-label">Password</b-col>
        <b-col sm="9"><b-form-input type="password" v-model="loginPassword"></b-form-input></b-col>
      </b-row>
    </b-container>
  </template>
  <template slot="footer">
    <b-btn class="float-right" variant="outline-success" @click="login">Login</b-btn>
    <b-btn class="float-right" variant="outline-secondary" @click="$refs.modal.close()">Cancel</b-btn>
    <b-btn class="float-right" variant="outline-secondary" @click="openSignup">Signup</b-btn>
  </template>
</base-modal>
</template>

<script src="./login-modal.ts">
</script>
