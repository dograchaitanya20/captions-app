import mongoose, { Schema } from 'mongoose';

const CaptionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['audio', 'video'],
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  transcription: {
    type: String,
    required: true,
    default: '',
  },
  captions: [
    {
      start: Number,
      end: Number,
      text: String,
    },
  ],
  duration: {
    type: Number,
    default: 0,
  },
  language: {
    type: String,
    default: 'en',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Caption', CaptionSchema);

