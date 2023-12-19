const User = require("./model/User");
const { isLoggedIn } = require("./auth");

async function getFollowing(req, res) {
  // Get the username from the request parameters or from the logged-in user session
  const username = req.params.user || req.session.user.username;

  try {
    // Find the user by username and populate the following field
    const user = await User.findOne({ username: username })
      .populate("following", "username")
      .exec();

    if (user) {
      // Map the following array to get an array of usernames
      const followingUsernames = user.following.map((user) => user.username);
      // Send the array of usernames that the user is following
      res
        .status(200)
        .json({ username: username, following: followingUsernames });
    } else {
      // If no user is found, send an appropriate error message
      res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    // If there is a server error, log it and send a 500 error
    console.error("Error fetching following list:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

async function addToFollowing(req, res) {
  // Get the username from the URL parameter
  const usernameToFollow = req.params.user;
  const loggedInUser = req.session.user;

  if (!usernameToFollow) {
    return res.status(400).send({ error: "Username to follow is required" });
  }

  try {
    // Find the user to follow to ensure they exist
    const userToFollow = await User.findOne({
      username: usernameToFollow,
    }).exec();
    if (!userToFollow) {
      return res.status(404).send({ error: "User to follow not found" });
    }

    // Make sure not to add duplicates
    const updatedUser = await User.findOneAndUpdate(
      { _id: loggedInUser._id, following: { $ne: userToFollow._id } }, // This query ensures no duplicates
      { $addToSet: { following: userToFollow._id } }, // $addToSet adds the item to the array only if it does not already exist
      { new: true } // Return the updated document
    ).populate("following", "username"); // Populate to return usernames

    if (updatedUser) {
      const updatedFollowingUsernames = updatedUser.following.map(
        (user) => user.username
      );
      res.status(200).json({
        username: loggedInUser.username,
        following: updatedFollowingUsernames,
      });
    } else {
      res.status(404).send({ error: "Logged in user not found" });
    }
  } catch (error) {
    console.error("Error adding to following list:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

async function removeFromFollowing(req, res) {
  const loggedInUserId = req.session.user._id; // The ObjectId of the logged-in user
  const usernameToUnfollow = req.params.user; // The username of the user to unfollow

  try {
    // Find the logged-in user along with the following list
    const loggedInUser = await User.findById(loggedInUserId);

    // Find the ObjectId of the user to unfollow
    const userToUnfollow = await User.findOne(
      { username: usernameToUnfollow },
      "_id"
    );
    if (!userToUnfollow) {
      return res.status(404).send({ error: "User to unfollow not found" });
    }

    // Check if the user to unfollow is already not in the following list
    if (!loggedInUser.following.includes(userToUnfollow._id)) {
      return res.status(400).send({ error: "You are not following this user" });
    }

    // Update the following array for the logged-in user
    const updatedUser = await User.findByIdAndUpdate(
      loggedInUserId,
      { $pull: { following: userToUnfollow._id } }, // Use $pull to remove the ObjectId
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).send({ error: "Logged in user not found" });
    }

    // Update the session information if necessary
    // ...

    // Return the updated list of following to the client
    res.status(200).send({
      username: req.session.user.username,
      following: updatedUser.following.map((id) => id.toString()),
    });
  } catch (error) {
    console.error("Error removing from following:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

module.exports = (app) => {
  app.get("/following/:user?", isLoggedIn, getFollowing); // GET list of users being followed
  app.put("/following/:user", isLoggedIn, addToFollowing);
  app.delete("/following/:user", isLoggedIn, removeFromFollowing);
};
