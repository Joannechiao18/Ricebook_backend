const mongoose = require("mongoose");
const connectionString = process.env.DB_CONNECTION_STRING;

mongoose
  .connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .catch((error) => {
    console.log({ error });
  });

// Connection successful
mongoose.connection.on("connected", () => {
  console.log("Mongoose connection open to " + 11);
});
