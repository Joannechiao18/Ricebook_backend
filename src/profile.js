const Profile = require("./model/Profile");
const User = require("./model/User");
const { isLoggedIn } = require("./auth");
const bcrypt = require("bcrypt");
const saltRounds = 10;

// Function to get a user's headline
async function getHeadline(req, res) {
  const username = req.params.user || req.session.user.username;

  try {
    const user = await Profile.findOne({ username }, "headline").exec(); // Select only the headline field
    if (user) {
      // Send the headline or the default headline if it doesn't exist
      res.send({ username: username, headline: user.headline });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}

async function updateHeadline(req, res) {
  const user = req.session.user;
  const { headline } = req.body;

  // Check if headline is provided
  if (!headline) {
    return res.status(400).send({ error: "Headline is required" });
  }

  try {
    // Update the user's headline in the database
    const updatedProfile = await Profile.findOneAndUpdate(
      { user_id: user._id }, // Use the username to identify the profile to update
      { $set: { headline: headline } },
      { new: true }
    ).exec();

    // If the profile was not found, send a 404 response
    if (!updatedProfile) {
      return res.status(404).send({ error: "Profile not found" });
    }

    // Update the session with the new headline
    req.session.user.headline = headline;

    // Send back the updated headline
    res.status(200).send({ username: user.username, headline: headline });
  } catch (error) {
    console.error("Error updating headline:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

async function getEmail(req, res) {
  const username = req.params.user || req.session.user.username;

  try {
    const profile = await Profile.findOne({ username }, "email").exec();

    if (profile && profile.email) {
      res.send({ username: username, email: profile.email });
    } else {
      res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
  }
}

async function updateEmail(req, res) {
  const user = req.session.user;
  const { email } = req.body;

  // Check if email is provided
  if (!email) {
    return res.status(400).send({ error: "Email is required" });
  }

  try {
    // Update the user's email in the database
    const updatedProfile = await Profile.findOneAndUpdate(
      { user_id: user._id },
      { $set: { email: email } },
      { new: true }
    ).exec();

    // If the profile was not found, send a 404 response
    if (!updatedProfile) {
      return res.status(404).send({ error: "Profile not found" });
    }

    // Update the session with the new email
    //req.session.user.email = email;

    // Send back the updated email
    res.status(200).send({ username: user.username, email: email });
  } catch (error) {
    console.error("Error updating email:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

async function getZipcode(req, res) {
  const username = req.params.user || req.session.user.username;

  try {
    const profile = await Profile.findOne({ username }, "zipcode").exec();
    if (profile && profile.zipcode) {
      res.send({ username: username, zipcode: profile.zipcode });
    } else {
      res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching zipcode:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

async function updateZipcode(req, res) {
  const user = req.session.user;
  const { zipcode } = req.body;

  // Check if zipcode is provided
  if (!zipcode) {
    return res.status(400).send({ error: "Zipcode is required" });
  }

  try {
    // Update the user's zipcode in the database using user._id
    const updatedProfile = await Profile.findOneAndUpdate(
      { user_id: user._id }, // Use user._id to identify the profile to update
      { $set: { zipcode: zipcode } },
      { new: true }
    ).exec();

    if (!updatedProfile) {
      return res.status(404).send({ error: "Profile not found" });
    }

    // Update the session with the new zipcode
    //req.session.user.zipcode = zipcode;

    res.status(200).send({ username: user.username, zipcode: zipcode });
  } catch (error) {
    console.error("Error updating zipcode:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

async function getDob(req, res) {
  const username = req.params.user || req.session.user.username;

  try {
    const profile = await Profile.findOne({ username }, "dob").exec();
    if (profile && profile.dob) {
      // Format the date as a string (e.g., in ISO format)
      //const dobAsString = user.dob.toISOString();
      res.status(200).json({
        username: username,
        dob: profile.dob,
      });
    } else {
      // If the user or user.dob doesn't exist, send an appropriate response
      res.status(404).json({ error: "User or date of birth not found" });
    }
  } catch (error) {
    console.error("Error fetching date of birth:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function getAvatar(req, res) {
  // Get the username from the request parameters or from the logged-in user session
  const username = req.params.user || req.session.user.username;

  try {
    // Find the user by username and select only the avatar field
    const profile = await Profile.findOne(
      { username: username },
      "avatar"
    ).exec();

    if (profile && profile.avatar) {
      // Send the avatar URL if the user exists and has an avatar set
      res.status(200).json({ username: username, avatar: profile.avatar });
    } else {
      // If no user is found, send an appropriate error message
      res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    // If there is a server error, log it and send a 500 error
    console.error("Error fetching avatar:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

async function updateAvatar(req, res) {
  const user = req.session.user;
  const { avatar } = req.body; // The new avatar URL sent in the request body

  // Check if an avatar URL is provided
  if (!avatar) {
    return res.status(400).send({ error: "Avatar URL is required" });
  }

  try {
    // Update the user's avatar in the database
    const updatedProfile = await Profile.findOneAndUpdate(
      { user_id: user._id }, // Use the User's _id to identify the profile to update
      { $set: { avatar: avatar } },
      { new: true } // Return the updated document
    ).exec();

    // If the profile was not found, send a 404 response
    if (!updatedProfile) {
      return res.status(404).send({ error: "Profile not found" });
    }

    // Update the session with the new avatar
    //req.session.user.avatar = avatar;

    // Send back the updated avatar URL
    res.status(200).send({ username: user.username, avatar: avatar });
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

const mongoose = require("mongoose");

async function changePassword(req, res) {
  const user = req.session.user;
  const { password } = req.body;

  // Validate the new password; this can be more complex depending on your password policies
  if (!password) {
    return res.status(400).send({ error: "New password is required" });
  }

  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);

    // Update the user's password in the database
    const updatedProfile = await Profile.findOneAndUpdate(
      { user_id: user._id },
      { $set: { password: hash } },
      { new: true }
    ).exec();

    // Update the user's password in the Users collection (if you have a separate Users model)
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { $set: { password: hash } },
      { new: true }
    ).exec();

    // If the user was not found or not updated, send a 404 response
    if (!updatedProfile || !updatedUser) {
      return res.status(404).send({ error: "User not found" });
    }

    req.session.user.password = hash;

    res.status(200).send({ result: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

async function getPhone(req, res) {
  const username = req.params.user || req.session.user.username;

  try {
    const profile = await Profile.findOne({ username }, "phone").exec();
    if (profile && profile.phone) {
      res.send({ username: username, phone: profile.phone });
    } else {
      res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching zipcode:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

async function updatePhone(req, res) {
  const user = req.session.user;
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).send({ error: "New phone number is required" });
  }

  try {
    const updatedProfile = await Profile.findOneAndUpdate(
      { user_id: user._id }, // Use the correct filter
      { $set: { phone: phone } },
      { new: true }
    ).exec();

    if (!updatedProfile) {
      return res.status(404).send({ error: "Profile not found" });
    }

    // Update the session with the new phone number
    //req.session.user.phone = phone;

    res.status(200).send({ username: user.username, phone: phone });
  } catch (error) {
    console.error("Error updating phone number:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

module.exports = (app) => {
  app.get("/headline/:user?", isLoggedIn, getHeadline);
  app.put("/headline", isLoggedIn, updateHeadline);

  app.get("/email/:user?", isLoggedIn, getEmail);
  app.put("/email", isLoggedIn, updateEmail);

  app.get("/zipcode/:user?", isLoggedIn, getZipcode);
  app.put("/zipcode", isLoggedIn, updateZipcode);

  app.get("/dob/:user?", isLoggedIn, getDob);

  app.get("/avatar/:user?", isLoggedIn, getAvatar);
  app.put("/avatar", isLoggedIn, updateAvatar);

  app.put("/password", isLoggedIn, changePassword);

  app.get("/phone/:user?", isLoggedIn, getPhone);
  app.put("/phone", isLoggedIn, updatePhone);
};
