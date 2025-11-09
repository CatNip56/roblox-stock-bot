import { SlashCommandBuilder } from '@discordjs/builders';
import User from '../models/User.js';
import Stock from '../models/Stock.js';
import Transaction from '../models/Transaction.js';
import AuditLog from '../models/AuditLog.js';

const TRADE_FEE_PERCENT = 0.01;

export default {
  data: new SlashCommandBuilder()
    .setName('sell')
    .setDescription('Sell shares')
    .addStringOption(o => o.setName('ticker').setRequired(true))
    .addNumberOption(o => o.setName('shares').setRequired(true)),
  async execute(interaction) {
    const ticker = interaction.options.getString('ticker').toUpperCase();
    const sharesToSell = interaction.options.getNumber('shares');
    if (sharesToSell <= 0) return interaction.reply({ content: 'Shares must be > 0', ephemeral: true });

    const stock = await Stock.findOne({ ticker });
    if (!stock || stock.suspended) return interaction.reply({ content: 'Stock unavailable', ephemeral: true });

    let user = await User.findOne({ discordId: interaction.user.id });
    if (!user) return interaction.reply({ content: 'You have no holdings', ephemeral: true });

    const h = user.holdings.find(x => x.ticker === ticker);
    if (!h || h.shares < sharesToSell) return interaction.reply({ content: 'Not enough shares', ephemeral: true });

    const proceeds = sharesToSell * stock.currentPrice;
    const fee = proceeds * TRADE_FEE_PERCENT;
    const receive = proceeds - fee;

    user.balance += receive;
    h.shares -= sharesToSell;
    if (h.shares <= 0) user.holdings = user.holdings.filter(x => x.ticker !== ticker);
    await user.save();

    await Transaction.create({ txType: 'sell', userId: interaction.user.id, ticker, shares: sharesToSell, price: stock.currentPrice });
    await AuditLog.create({ type: 'trade', userId: interaction.user.id, stockTicker: ticker, details: { tx: 'sell', shares: sharesToSell, price: stock.currentPrice, fee }, by: interaction.user.id });

    stock.currentPrice = +(stock.currentPrice * (1 - Math.min(0.02, (sharesToSell / Math.max(1, stock.basePrice / stock.currentPrice + 1))))).toFixed(2);
    await stock.save();

    return interaction.reply({ content: `✅ Sold ${sharesToSell} shares of ${stock.commonName} (${ticker}) for ${receive.toFixed(2)} after fee ${fee.toFixed(2)}. New balance: ${user.balance.toFixed(2)}` });
  }
};
