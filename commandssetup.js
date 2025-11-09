import { SlashCommandBuilder } from '@discordjs/builders';
import Config from '../models/Config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup bot configuration (owner only)')
    .addSubcommand(sc => sc.setName('ownerid').setDescription('Set owner id').addStringOption(o => o.setName('id').setRequired(true)))
    .addSubcommand(sc => sc.setName('adminrole').setDescription('Set admin role').addRoleOption(o => o.setName('role').setRequired(true)))
    .addSubcommand(sc => sc.setName('fbirole').setDescription('Set FBI role').addRoleOption(o => o.setName('role').setRequired(true)))
    .addSubcommand(sc => sc.setName('advisorrole').setDescription('Set advisor role').addRoleOption(o => o.setName('role').setRequired(true)))
    .addSubcommand(sc => sc.setName('show').setDescription('Show config')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const db = await Config.findOne({}) || {};
    const ownerEnv = process.env.OWNER_ID;
    const currentOwner = db.ownerId || ownerEnv;
    if (!currentOwner || interaction.user.id !== currentOwner.toString()) {
      return interaction.reply({ content: 'Only the bot owner can run this.', ephemeral: true });
    }

    if (sub === 'ownerid') {
      const id = interaction.options.getString('id');
      await Config.updateOne({}, { $set: { ownerId: id } }, { upsert: true });
      return interaction.reply({ content: `Owner set to ${id}`, ephemeral: true });
    }
    if (sub === 'adminrole') {
      const role = interaction.options.getRole('role');
      await Config.updateOne({}, { $set: { adminRoleId: role.id } }, { upsert: true });
      return interaction.reply({ content: `Admin role set to ${role.name}`, ephemeral: true });
    }
    if (sub === 'fbirole') {
      const role = interaction.options.getRole('role');
      await Config.updateOne({}, { $set: { fbiRoleId: role.id } }, { upsert: true });
      return interaction.reply({ content: `FBI role set to ${role.name}`, ephemeral: true });
    }
    if (sub === 'advisorrole') {
      const role = interaction.options.getRole('role');
      await Config.updateOne({}, { $set: { advisorRoleId: role.id } }, { upsert: true });
      return interaction.reply({ content: `Advisor role set to ${role.name}`, ephemeral: true });
    }
    if (sub === 'show') {
      const cfg = await Config.findOne({}) || {};
      return interaction.reply({ content: `Owner: ${cfg.ownerId || process.env.OWNER_ID}\nAdminRole: ${cfg.adminRoleId || 'Not set'}\nFBIRole: ${cfg.fbiRoleId || 'Not set'}\nAdvisorRole: ${cfg.advisorRoleId || 'Not set'}`, ephemeral: true });
    }
  }
};
