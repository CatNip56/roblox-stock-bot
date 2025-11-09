import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
  name: String,
  price: Number,
  owner: String
});

export default mongoose.model("Stock", stockSchema);
