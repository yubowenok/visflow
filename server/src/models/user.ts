import bcrypt from 'bcryptjs';
import { Schema, model, HydratedDocument } from 'mongoose';

const PASSWORD_SALT_ROUND = 10;

export interface IUser {
  username: string;
  email: string;
  password: string;
  isAdmin?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  isAdmin: Boolean,
}, { timestamps: true });

// Hash the password whenever it is set or changed (signup, changePassword).
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  this.password = await bcrypt.hash(this.password, PASSWORD_SALT_ROUND);
});

const User = model<IUser>('User', userSchema);
export default User;
