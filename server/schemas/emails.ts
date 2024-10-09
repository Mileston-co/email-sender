import mongoose, { Schema, model, models } from "mongoose";

const EmailSchema = new Schema({
  message: {
    type: String,
    required: [true, "Messages are required!"],
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: [true, 'user is required!'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const Email = models.Email || model("Email", EmailSchema);

export default Email;