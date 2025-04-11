require('dotenv').config();
const { 
    Client, 
    GatewayIntentBits, 
    SlashCommandBuilder, 
    REST, 
    Routes 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const SERVER_ID = '1334544134257508363'; // Your server ID

console.log("🚀 Solar Star bot is starting...");

if (!TOKEN) {
    console.error("❌ DISCORD_TOKEN is missing. Check your .env file or Railway environment variables.");
    process.exit(1);
}

if (!CLIENT_ID) {
    console.error("❌ CLIENT_ID is missing. Check your .env file or Railway environment variables.");
    process.exit(1);
}

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    const commands = [
        new SlashCommandBuilder()
            .setName('announce')
            .setDescription('Send a multi-line text announcement')
            .addChannelOption(option =>
                option.setName('channel')
                    .setDescription('The channel to send the announcement')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('message')
                    .setDescription('The announcement message (use \\n for line breaks)')
                    .setRequired(true)
            ),

        new SlashCommandBuilder()
            .setName('editannounce')
            .setDescription('Edit an existing announcement')
            .addStringOption(option =>
                option.setName('message_id')
                    .setDescription('The ID of the message to edit')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('new_message')
                    .setDescription('The new message content (use \\n for line breaks)')
                    .setRequired(true)
            ),

        new SlashCommandBuilder()
            .setName('deleteannounce')
            .setDescription('Delete an announcement')
            .addStringOption(option =>
                option.setName('message_id')
                    .setDescription('The ID of the message to delete')
                    .setRequired(true)
            ),

        new SlashCommandBuilder()
            .setName('imageannounce')
            .setDescription('Send an announcement with images')
            .addChannelOption(option =>
                option.setName('channel')
                    .setDescription('The channel to send the announcement')
                    .setRequired(true))
            .addStringOption(option =>
                option.setName('message')
                    .setDescription('The announcement message')
                    .setRequired(true)
            ),
    ];

    for (let i = 1; i <= 10; i++) {
        commands[3].addAttachmentOption(option =>
            option.setName(`image${i}`)
                .setDescription(`Attach image ${i} (optional)`)
                .setRequired(i === 1) // Only the first image is required
        );
    }

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    try {
        console.log("🗑 Clearing old commands...");
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, SERVER_ID), { body: [] });
        console.log("✅ Old commands cleared!");

        console.log("📝 Registering new commands...");
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, SERVER_ID), { body: commands });
        console.log("✅ Commands registered successfully!");
    } catch (error) {
        console.error("❌ Error registering commands:", error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    console.log(`🛠 Command received: ${interaction.commandName}`);

    await interaction.deferReply({ ephemeral: true });

    const commandName = interaction.commandName;

    try {
        if (commandName === 'announce') {
            const message = interaction.options.getString('message');
            const announcementChannel = interaction.options.getChannel('channel');

            if (!announcementChannel || !announcementChannel.isTextBased()) {
                return interaction.editReply('⚠️ Invalid channel. Please select a text channel.');
            }

            const formattedMessage = `📢 **Announcement!**\n${message.replace(/\\n/g, '\n')}`;
            const sentMessage = await announcementChannel.send(formattedMessage);

            await sentMessage.react('💖');
            await sentMessage.react('🔥');
            await sentMessage.react('✨');

            await interaction.editReply(`✅ Announcement sent in ${announcementChannel}`);
        }

        else if (commandName === 'editannounce') {
            const messageId = interaction.options.getString('message_id');
            const newMessage = interaction.options.getString('new_message');
            const messageToEdit = await interaction.channel.messages.fetch(messageId);

            await messageToEdit.edit(`📢 **Announcement!**\n\n${newMessage.replace(/\\n/g, '\n')}`);
            await interaction.editReply('✅ Announcement updated!');
        }

        else if (commandName === 'deleteannounce') {
            const messageId = interaction.options.getString('message_id');
            const messageToDelete = await interaction.channel.messages.fetch(messageId);

            await messageToDelete.delete();
            await interaction.editReply('✅ Announcement deleted!');
        }

        else if (commandName === 'imageannounce') {
            const announcementChannel = interaction.options.getChannel('channel');
            const message = interaction.options.getString('message');

            if (!announcementChannel || !announcementChannel.isTextBased()) {
                return interaction.editReply('⚠️ Invalid channel. Please select a text channel.');
            }

            const images = [];
            for (let i = 1; i <= 10; i++) {
                const image = interaction.options.getAttachment(`image${i}`);
                if (image) images.push(image.url);
            }

            if (images.length === 0) {
                return interaction.editReply('⚠️ Please attach at least one image!');
            }

            const sentMessage = await announcementChannel.send({
                content: `📢 **${message}**`,
                files: images
            });

            await sentMessage.react('💖');
            await sentMessage.react('🔥');
            await sentMessage.react('✨');

            await interaction.editReply(`✅ Announcement with images sent in ${announcementChannel}`);
        }

    } catch (error) {
        console.error("❌ Error handling command:", error);
        await interaction.editReply('❌ Something went wrong while processing the command.');
    }
});

client.login(TOKEN).then(() => {
    console.log("🔑 Successfully logged in!");
}).catch(error => {
    console.error("❌ Failed to log in! Check your token.");
    console.error(error);
});
