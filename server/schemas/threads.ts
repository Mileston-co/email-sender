import { Schema, model, models } from 'mongoose';

const MessageSchema = new Schema({
  sender: {
    type: String, // Either the external email (e.g., chatgpt.com) or your platform email (e.g., @mileston.co)
    required: true,
  },
  content: {
    type: String, // The message content (body of the email)
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now, // Automatically sets the time the message was sent or received
  },
  messageId: {
    type: String, // Gmail message ID for easier tracking and retrieval
    unique: true,
    required: true,
  },
});

const ThreadSchema = new Schema({
  participants: [
    {
      type: String, // e.g., ["tomiwa@mileston.co", "someone@chatgpt.com"]
      required: true,
    },
  ],
  subject: {
    type: String, // Subject of the thread (optional)
  },
  messages: [MessageSchema], // Array of messages
  lastUpdated: {
    type: Date,
    default: Date.now, // Updates whenever a new message is added
  },
});

// Create the Thread model
const Thread = models.Thread || model('Thread', ThreadSchema);

export default Thread;
