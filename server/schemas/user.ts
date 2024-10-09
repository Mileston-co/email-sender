import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  email: {
    type: String,
    unique: [true, "Email already exists!"],
    required: [true, "Email is required!"],
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  gmailToken: {
    access_token: {
      type: String,
    },
    refresh_token: {
      type: String,
    },
    scope: {
      type: String,
    },
    token_type: {
      type: String,
    },
    expiry_date: {
      type: Number, // Store expiration date of the token
    },
  },
});

const User = models.User || model("User", UserSchema);

export default User;