import { Client, GatewayIntentBits } from "discord.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import express from "express";

dotenv.config();
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.once("ready", () => console.log(`✅ Logged in as ${client.user.tag}`));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 MongoDB Connected"))
  .catch(err => console.error(err));

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (msg.content.startsWith("!ping")) msg.reply("🏓 Pong!");
});

const app = express();
app.get("/", (_, res) => res.send("Bot is alive"));
app.listen(3000, () => console.log("🌐 Server running"));

client.login(process.env.TOKEN);
