import { SlashCommandBuilder } from '@discordjs/builders';
import User from '../models/User.js';
import Stock from '../models/Stock.js';
import Transaction from '../models/Transaction.js';
import AuditLog from '../models/AuditLog.js';

const TRADE_FEE_PERCENT = 0.01;

export default {
  data: new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Buy shares by amount (credits)')
    .addStringOption(o => o.setName('ticker').setRequired(true))
    .addNumberOption(o => o.setName('amount').setRequired(true)),
  async execute(interaction) {
    const ticker = interaction.options.getString('ticker').toUpperCase();
    const amount = interaction.options.getNumber('amount');
    if (amount <= 0) return interaction.reply({ content: 'Amount must be > 0', ephemeral: true });

    const stock = await Stock.findOne({ ticker, verified: true, suspended: false });
    if (!stock) return interaction.reply({ content: 'Stock not available', ephemeral: true });

    const price = stock.currentPrice;
    const shares = amount / price;
    if (shares <= 0) return interaction.reply({ content: 'Amount too low', ephemeral: true });

    let user = await User.findOne({ discordId: interaction.user.id });
    if (!user) user = new User({ discordId: interaction.user.id });

    const fee = amount * TRADE_FEE_PERCENT;
    const total = amount + fee;
    if (user.balance < total) return interaction.reply({ content: `Insufficient balance. Need ${total.toFixed(2)}`, ephemeral: true });

    user.balance -= total;
    const h = user.holdings.find(x => x.ticker === ticker);
    if (h) h.shares += shares; else user.holdings.push({ ticker, shares });
    await user.save();

    await Transaction.create({ txType: 'buy', userId: interaction.user.id, ticker, shares, price });
    await AuditLog.create({ type: 'trade', userId: interaction.user.id, stockTicker: ticker, details: { tx: 'buy', shares, price, amount, fee }, by: interaction.user.id });

    // simple price impact
    stock.currentPrice = +(stock.currentPrice * (1 + Math.min(0.02, (shares / Math.max(1, stock.basePrice / stock.currentPrice + 1))))).toFixed(2);
    await stock.save();

    return interaction.reply({ content: `✅ Bought ${shares.toFixed(4)} shares of ${stock.commonName} (${ticker}) for ${amount.toFixed(2)} (fee ${fee.toFixed(2)}). New balance: ${user.balance.toFixed(2)}` });
  }
};
