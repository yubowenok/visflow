export interface UserState {
  username: string;

  // An error message displayed during the login/register process
  errorMessage: string;

  // Function to be called after the user logins
  loginCallback?: () => void;
}
