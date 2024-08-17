import { Schema, models, model } from "mongoose";

// Define the verification token schema
const VerificationTokenSchema = new Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Default expiration in 24 hours
  },
});

// Create the VerificationToken model
const VerificationToken =
  models.VerificationToken ||
  model("VerificationToken", VerificationTokenSchema);

export default VerificationToken;