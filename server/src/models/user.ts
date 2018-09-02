import bcrypt from 'bcrypt-nodejs';
import mongoose from 'mongoose';
import { NextFunction } from 'express';

const PASSWORD_SALT_ROUND = 10;

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

const hashPassword = (password: string, callback: (err: Error, hash: string) => void) => {
  bcrypt.genSalt(PASSWORD_SALT_ROUND, (err: Error, salt: string) => {
    if (err) {
      return callback(err, '');
    }
    bcrypt.hash(password, salt, undefined, (mongooseErr: mongoose.Error, hash) => {
      if (mongooseErr) {
        return callback(mongooseErr, '');
      }
      callback(null, hash);
    });
  });
};

userSchema.pre('save', function(next: NextFunction) { // Must user funciton to access "this".
  const user = this as UserModel;
  /*
  if (!user.isModified('password')) {
    return next();
  }
  */
  hashPassword(user.password, (err, hash) => {
    if (err) {
      return next(err);
    }
    user.password = hash;
    next();
  });
});

const User = mongoose.model<UserModel>('User', userSchema);
export default User;
