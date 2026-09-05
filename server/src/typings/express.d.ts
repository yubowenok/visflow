import { IUser } from '../models/user';

declare global {
  namespace Express {
    // Populated by passport's deserializeUser (see config/passport.ts).
    interface User extends IUser {}
  }
}

export {};
