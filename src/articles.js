const { isLoggedIn } = require("./auth");
const mongoose = require("mongoose");
const { Article, Comment } = require("./model/Article");
const User = require("./model/User");

//const Article = require("./model/Article");
//const Comment = require("./model/Comment");

async function createArticle(req, res) {
  const { text } = req.body;
  const loggedInUser = req.session.user.username; // Get the logged-in user from the session
  const image = req.file ? req.file.path : null; // If using multer for file uploads

  // Validate the input
  if (!text) {
    return res
      .status(400)
      .send({ error: "Text content is required for the article" });
  }

  try {
    // Create a new article instance
    const newArticle = new Article({
      author: loggedInUser,
      text: text,
      image: image, // Only include this if an image was uploaded
      date: new Date(), // Server sets the current date and time
      comments: [], // Initialize comments as an empty array
    });

    // Save the new article to the database
    const savedArticle = await newArticle.save();

    // Respond with the new article data
    res.status(201).json({
      articles: [
        {
          id: savedArticle.customId,
          author: savedArticle.author,
          text: savedArticle.text,
          image: savedArticle.image,
          date: savedArticle.date,
          comments: savedArticle.comments,
        },
      ],
    });
  } catch (error) {
    console.error("Error creating new article:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

async function getArticles(req, res) {
  const identifier = req.params.id; // Can be a post id or username
  const loggedInUser = req.session.user.username;

  try {
    let articles;
    if (identifier) {
      if (!isNaN(identifier)) {
        articles = await Article.find({ customId: identifier }).exec();
      } else {
        articles = await Article.find({ author: identifier }).exec();
      }
    } else {
      articles = await Article.find({
        /*  feed logic here */
      }).exec();
    }

    const response = articles.map((article) => ({
      id: article.customId,
      author: article.author,
      text: article.text,
      comments: article.comments,
      date: article.date,
    }));

    res.json({ articles: response });
  } catch (error) {
    res.status(500).send({ error: "Internal server error" });
  }
}

async function findAuthorIdByUsername(authorUsername) {
  try {
    const author = await User.findOne({ username: authorUsername }).exec();
    if (author) {
      return author._id; // This is the ObjectId of the author
    } else {
      return null; // No author found with the given username
    }
  } catch (error) {
    console.error("Error finding author by username:", error);
    return null;
  }
}

async function updateArticle(req, res) {
  const commentId = parseInt(req.body.commentId); // Make sure it's an integer
  const { text } = req.body;
  const articleId = req.params.id;
  const loggedInUserId = req.session.user._id; // Ensure this is a MongoDB ObjectId

  if (!text) {
    return res.status(400).send({ error: "Text content is required" });
  }

  try {
    const article = await Article.findOne({ customId: articleId }).exec();

    if (!article) {
      return res.status(404).send({ error: "Article not found" });
    }

    //const authorObjectId = new mongoose.Types.ObjectId(article.author);
    /*findAuthorIdByUsername(article.author).then((authorId) => {
      if (authorId) {
        //console.log("Author ObjectId:", authorId);
        authorObjectId = authorId;
      } else {
        console.log("No author found with the given username.");
      }
    });*/

    const authorObjectId = await findAuthorIdByUsername(article.author);
    if (!authorObjectId.equals(loggedInUserId)) {
      return res.status(403).send({ error: "Forbidden" });
    }

    if (commentId === undefined) {
      article.text = text;
    } else if (commentId === -1) {
      const newComment = new Comment({
        body: text,
        author: loggedInUserId,
      });
      article.comments.push(newComment);
    } else {
      // Find the comment by customId
      const comment = article.comments.find((c) => c.customId === commentId);
      if (!comment) {
        return res.status(404).send({ error: "Comment not found" });
      }

      console.log(comment.author);

      //comment.author is stored as ObjectId in DB
      if (!comment.author.equals(loggedInUserId)) {
        return res.status(403).send({ error: "Forbidden" });
      }
      comment.body = text;
    }

    await article.save();
    res.status(200).json(article);
  } catch (error) {
    console.error("Error updating article:", error);
    res.status(500).send({ error: "Internal server error" });
  }
}

module.exports = (app) => {
  app.post("/article", isLoggedIn, createArticle);
  app.get("/articles/:id?", isLoggedIn, getArticles);
  app.put("/articles/:id", isLoggedIn, updateArticle);
};
