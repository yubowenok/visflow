import bcrypt from 'bcrypt-nodejs';
import mongoose from 'mongoose';
import { NextFunction } from 'express';

export interface UserModel extends mongoose.Document {
  username: string;
  email: string;
  password: string;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
}, { timestamps: true });

userSchema.index({ username: 1 }, { unique: true });

userSchema.pre('save', function(next: NextFunction) {
  const user = this as UserModel;
  /*
  if (!user.isModified('password')) {
    return next();
  }
  */
  bcrypt.genSalt(10, (err: Error, salt: string) => {
    if (err) {
      return next(err);
    }
    bcrypt.hash(user.password, salt, undefined, (mongooseErr: mongoose.Error, hash) => {
      if (mongooseErr) {
        return next(mongooseErr);
      }
      user.password = hash;
      next();
    });
  });
});

const User = mongoose.model<UserModel>('User', userSchema);
export default User;
