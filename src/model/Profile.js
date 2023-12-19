const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    //unique: true,
    required: [true, "User reference is required"],
  },

  username: {
    type: String,
    //unique: true,
  },
  email: {},
  dob: {},
  phone: {},
  zipcode: {},
  password: {},
  headline: {
    type: String,
    default: "This is the default headline.",
  },
  avatar: {
    type: String,
    default:
      "https://upload.wikimedia.org/wikipedia/en/thumb/4/4e/DWLeebron.jpg/220px-DWLeebron.jpg",
  },
});

module.exports = mongoose.model("profile", profileSchema);
