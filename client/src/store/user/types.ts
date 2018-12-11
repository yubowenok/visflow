export interface UserInfo {
  username: string;
  email: string;
}
export interface SignupProfile {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
}

export interface LoginProfile {
  username: string;
  password: string;
}

export interface ChangePasswordProfile {
  password: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UserState {
  username: string;

  userInfo: UserInfo;

  // An error message displayed during the login/register process
  errorMessage: string;

  // Function to be called after the user logins
  loginCallback?: () => void;
}
