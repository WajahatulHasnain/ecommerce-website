const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  sequence: {
    type: Number,
    default: 0
  }
});

// Static method to get next sequence value
counterSchema.statics.getNextSequence = async function(name) {
  const counter = await this.findByIdAndUpdate(
    name,
    { $inc: { sequence: 1 } },
    { 
      new: true, 
      upsert: true, // Create if doesn't exist
      runValidators: true 
    }
  );
  return counter.sequence;
};

module.exports = mongoose.model("Counter", counterSchema);