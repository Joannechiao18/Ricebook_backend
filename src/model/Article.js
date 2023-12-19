const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});
const Counter = mongoose.model("Counter", counterSchema);

// Comment Schema
const commentSchema = new mongoose.Schema({
  customId: { type: Number, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  body: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

// Pre-save hook for Comment Schema
commentSchema.pre("save", async function (next) {
  if (this.isNew) {
    // This hook should only run if the comment is a subdocument being added to an Article.
    const article = this.parent();
    if (article) {
      let maxId = 0;
      article.comments.forEach((comment) => {
        if (comment.customId > maxId) {
          maxId = comment.customId;
        }
      });

      // Set this comment's customId to the highest + 1
      this.customId = maxId + 1;
    }
  }
  next();
});

// Article Schema
const articleSchema = new mongoose.Schema({
  author: String,
  text: {},
  image: String,
  date: { type: Date, default: Date.now },
  comments: [commentSchema],
  customId: { type: Number, unique: true, index: true },
  created: { type: Date, default: Date.now },
});

// New pre-save hook for articleSchema using Counter
articleSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: "article" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.customId = counter.seq;
  }
  next();
});

// Models
const Article = mongoose.model("Article", articleSchema);
const Comment = mongoose.model("Comment", commentSchema);

// Export Models
module.exports = {
  Article,
  Comment,
};
