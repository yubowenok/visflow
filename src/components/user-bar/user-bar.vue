<template>
<div class="user-bar">
  <div v-if="username" class="username">
    <span @click="openProfileModal">
      <i class="fas fa-user"></i>
      {{ username }}
    </span>
    <i class="logout fas fa-sign-out-alt" @click="logout"></i>
  </div>
  <button v-if="!username"
    @click="openLoginModal"
    class="btn btn-outline-success"
  >
    Login
  </button>
  <b-modal v-model="loginModalVisible"
    title="Login">
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <b-container fluid>
      <b-row>
        <b-col sm="3" class="label">Username</b-col>
        <b-col sm="9"><b-form-input type="text" v-model="loginUsername"></b-form-input></b-col>
      </b-row>
      <b-row>
        <b-col sm="3" class="label">Password</b-col>
        <b-col sm="9"><b-form-input type="password" v-model="loginPassword"></b-form-input></b-col>
      </b-row>
    </b-container>
    <div slot="modal-footer">
      <b-btn class="float-right" variant="outline-success" @click="login">Login</b-btn>
      <b-btn class="float-right" variant="outline-secondary" @click="closeLoginModal();">Cancel</b-btn>
      <b-btn class="float-right" variant="outline-secondary" @click="closeLoginModal(); openSignupModal()">Signup</b-btn>
    </div>
  </b-modal>
  <b-modal v-model="signupModalVisible"
    title="Signup New User">
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <b-container fluid>
      <b-row>
        <b-col sm="4" class="label">Username</b-col>
        <b-col sm="8"><b-form-input type="text" v-model="signupUsername"></b-form-input></b-col>
      </b-row>
      <b-row>
        <b-col sm="4" class="label">Password</b-col>
        <b-col sm="8"><b-form-input type="password" v-model="signupPassword"></b-form-input></b-col>
      </b-row>
      <b-row>
        <b-col sm="4" class="label">Confirm Password</b-col>
        <b-col sm="8"><b-form-input type="password" v-model="signupConfirmPassword"></b-form-input></b-col>
      </b-row>
      <b-row>
        <b-col sm="4" class="label">Email</b-col>
        <b-col sm="8"><b-form-input type="email" v-model="signupEmail"></b-form-input></b-col>
      </b-row>
    </b-container>
    <div slot="modal-footer">
      <b-btn class="float-right" variant="outline-success" @click="signup">Submit</b-btn>
      <b-btn class="float-right" variant="outline-secondary" @click="closeSignupModal">Cancel</b-btn>
    </div>
  </b-modal>
  <b-modal v-model="profileModalVisible"
    title="Profile">
    Profile is coming soon.
    <div slot="modal-footer">
      <b-btn class="float-right" variant="outline-secondary" @click="closeProfileModal">OK</b-btn>
    </div>
  </b-modal>
</div>
</template>

<style scoped src="./user-bar.scss"></style>

<script src="./user-bar.ts">
</script>
