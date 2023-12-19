const User = require("./model/User");
const Profile = require("./model/Profile");
const bcrypt = require("bcrypt");
const saltRounds = 10;

function isLoggedIn(req, res, next) {
  const user = req.session.user;
  if (!user) {
    return res.sendStatus(401); // Unauthorized
  }

  //console.log("User is logged in, proceeding to next middleware/route");
  next();
}

async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .send({ error: "Username and password are required" });
  }

  try {
    // Use Mongoose to find the user in the database
    const user = await User.findOne({ username: username }).exec();

    if (!user) {
      return res.status(401).send({ error: "User not found" });
    }

    // Use bcrypt to compare the provided password with the stored hash
    const match = await bcrypt.compare(password, user.password);

    if (match) {
      req.session.user = user; // Make sure to only include the necessary user details

      // Now call the postLoginMiddleware
      postLoginMiddleware(req, res, () => {
        // After the postLoginMiddleware has been applied,
        // you can then send back the response to the client.
        res.send({ username: username, result: "success" });
      });
    } else {
      res.status(401).send({ error: "Invalid password" });
    }
  } catch (error) {
    console.error("Error during authentication:", error);
    return res.status(500).send({ error: "Internal server error" });
  }
}
function postLoginMiddleware(req, res, next) {
  // Now that req.session.user is set, you can access it here
  //console.log("Post-login logic applied for user:", req.session.user.username);

  next();
}

async function register(req, res) {
  const { username, password, email, dob, phone, zipcode } = req.body;

  if (!username || !password || !email || !dob || !phone || !zipcode) {
    return res.status(400).send({ error: "Fill out all required information" });
  }

  // Check if username already exists in the database instead of a local object
  try {
    const user = await User.findOne({ username: username }).exec();

    if (user) {
      return res.status(400).send({ error: "Username already exists" });
    }

    // Generate a salt and hash the password
    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) {
        return res.status(500).send({ error: "Internal server error" });
      }

      const newUser = new User({
        username,
        password: hash,
        //email,
        //dob,
        //phone,
        //zipcode,
      });

      console.log({ newUser });

      await newUser.save();

      // Now create and save the user profile with the initial information
      const newProfile = new Profile({
        user_id: newUser._id, // This links the Profile to the User document
        username,
        email,
        dob,
        phone,
        zipcode,
        password: hash, //can't store hash, because password can be updated
      });

      console.log({ newProfile });

      await newProfile.save();
      res.send({ username: username, result: "success" });
    });
  } catch (error) {
    return res.status(500).send({ error: "Internal server error" });
  }
}

function logout(req, res) {
  const user = req.session.user;
  if (user) {
    req.session.user = null;

    res.send({ result: "success" });
  } else {
    res.status(401).send({ error: "You are not logged in" });
  }
}

module.exports = {
  AuthRoutes: (app) => {
    // Define open paths
    // Define open paths to include login and registration
    const openPaths = ["/", "/login", "/register", "/logout"];

    // This app.use should be placed before the route handlers to ensure it is executed.
    app.use((req, res, next) => {
      if (!openPaths.includes(req.path)) {
        // If it's not an open path, apply the isLoggedIn middleware
        return isLoggedIn(req, res, next);
      }
      // If it is an open path, just go to the next middleware/route
      next();
    });

    app.post("/login", login);
    app.post("/register", register);
    app.put("/logout", logout);
  },
  isLoggedIn,
};

// Export the isLoggedIn middleware so it can be used in other files
module.exports.isLoggedIn = isLoggedIn;
