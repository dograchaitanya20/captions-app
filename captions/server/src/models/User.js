import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  preferences: {
    fontSize: { type: Number, default: 24 },
    captionColor: { type: String, default: 'white' },
    bgOpacity: { type: String, default: 'medium' },
    autoScroll: { type: Boolean, default: true },
    soundNotifications: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: true },
  },
});

export default mongoose.model('User', UserSchema);

