import { SlashCommandBuilder } from '@discordjs/builders';
import User from '../models/User.js';
import Stock from '../models/Stock.js';

export default {
  data: new SlashCommandBuilder().setName('portfolio').setDescription('Show your portfolio'),
  async execute(interaction) {
    const user = await User.findOne({ discordId: interaction.user.id });
    if (!user) return interaction.reply({ content: 'No portfolio. You get starter balance upon first trade.', ephemeral: true });

    let out = `💼 **${interaction.user.tag}**\nBalance: ${user.balance.toFixed(2)}\n\n`;
    if (!user.holdings.length) out += 'No holdings.';
    else {
      for (const h of user.holdings) {
        const stock = await Stock.findOne({ ticker: h.ticker });
        out += `• ${stock ? stock.commonName : h.ticker} (${h.ticker}): ${h.shares.toFixed(4)} shares\n`;
      }
    }
    return interaction.reply({ content: out, ephemeral: false });
  }
};
