const request = require("supertest");
const app = require("../index");
const mongoose = require("mongoose");
const User = require("../src/model/User");
const Profile = require("../src/model/Profile");
const { Article } = require("../src/model/Article");

// Helper to generate a unique ID for the test user
const generateUniqueId = () => `testUser${Date.now()}`;

describe("User Workflow Tests", () => {
  let userId, username, agent;

  beforeAll(async () => {
    await mongoose.connect(process.env.DB_CONNECTION_STRING, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Article.deleteMany({});

    username = generateUniqueId();
    agent = request.agent(app); // Create an agent to maintain cookies across requests
  });

  it("should register, login, create article, update headline, and logout", async () => {
    await agent
      // 1. Register a user
      .post("/register")
      .send({
        username: "testUser",
        password: "123",
        email: "newuser@example.com",
        dob: "2000-01-01",
        phone: "1234567890",
        zipcode: "12345",
      })
      .expect(200);

    // 2. Log in as the new user
    await agent
      .post("/login")
      .send({ username: "testUser", password: "123" })
      .expect(200);

    // 3. Create a new article
    const articleResponse = await agent
      .post("/article")
      .send({ text: "This is a test article." })
      .expect(201);

    const articleId = articleResponse.body.articles[0].id;
    expect(articleId).toBeDefined();

    // 4. Update the status headline
    const newHeadline = "Updated headline";
    await agent.put("/headline").send({ headline: newHeadline }).expect(200);

    const headlineResponse = await agent.get("/headline").expect(200);
    expect(headlineResponse.body.headline).toBe(newHeadline);

    // 5. Log out the user
    await agent.put("/logout").expect(200);
  });
});
