import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  email: {
    type: String,
    unique: [true, "Email already exists!"],
    required: [true, "Email is required!"],
  },
  firstName: {
    type: String,
    // required: [true, 'Firstname is required!'],
  },
  lastName: {
    type: String,
    // required: [true, 'Lastname is required!'],
  },
});

const User = models.User || model("User", UserSchema);

export default User;