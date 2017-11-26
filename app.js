const discord = require("discord.js");

const sounds = require("./lib/sounds.js");

const config = require("./config.json");

var client = new discord.Client();
client.login(config.token);

client.on("ready", function () {
    console.log("Airhorn Bot is ready to blow!");
    client.user.setGame("Airhorn");
});

client.on("message", message => {
    // Ignore all messages that don't begin with bot prefix
    if (!message.content.startsWith(config.prefix)) return;

    if (!message.channel instanceof discord.TextChannel) {
        message.channel.send("Whoa! Don't slide into my DMs. I only work on servers.");
        return;
    }

    // Split bot command into primary command and arguments, excluding prefix
    var args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    var command = args.shift().toLowerCase();

    if (command === "save") {
        // Validate that the right number of attachments exist
        if (message.attachments.keyArray().length < 1) {
            message.channel.send("You didn't attach anything to that message.");
            return;
        }

        if (message.attachments.keyArray().length > 1) {
            message.channel.send("There's multiple things attached to that message. I can only save one at a time. Please try again with only one attachment.");
            return;
        }

        // Make sure the user specified a name
        if (args.length < 1) {
            message.channel.send("You need to give me some information here.\n\nUsage:```!save {name}```");
            return;
        }

        if (args[0] in ["save", "init"]) {
            message.channel.send("The name you specified for that sound is a reserved word. Try a different one.");
            return;
        }

        sounds.addSound(message.guild.id, args[0], message.attachments.first(), err => {
            if (err) {
                switch (err.code) {
                    case "InvalidFileType":
                        message.channel.send("That isn't a valid file type that I can play! You should try converting the sound file. Sorry!");
                        return;
                    case "SoundAlreadyExists":
                        message.channel.send("That sound already exists. If you want to overwrite it, have an admin delete the existing sound first.");
                        return;
                    default:
                        message.channel.send("I got an error and I don't know how to handle it! Please report this to mjdean1994@gmail.com!\n\nError:```" + JSON.stringify(err) + "```");
                        return;
                }
            }

            message.channel.send("Alright, I've added that sound! Try it out with `!" + args[0] + "`.");
        });
    }
    else if (command === "delete") {
        message.channel.send("Delete functionality isn't implemented yet. If you've seen this message for a while, try giving my developer a nudge at mjdean1994@gmail.com.");
        return;
    }
    else if (command === "init") {
        sounds.initializeDefaultSounds(message.guild.id, err => {
            if (err) {
                message.channel.send(err);
                return;
            }
            else {
                message.channel.send("Airhorn Bot initialized for this server. Try `!airhorn` now!");
            }
        })
    }
    else {
        // If we get here, we assume the user is trying to play a sound
        var voiceChannel = message.member.voiceChannel;

        if (!voiceChannel) {
            message.channel.send("You're not in a voice channel, " + message.member.displayName + ". I don't know where to go.");
            return;
        }

        sounds.getSoundPath(message.guild.id, command, function (path, err) {
            // Fail silently if we can't find the sound...user might not have been trying to play one.
            if (err) return;

            // Join voice channel and play the sound!
            voiceChannel.join().then(connection => {
                var dispatcher = connection.playFile(path);

                dispatcher.on("end", end => {
                    voiceChannel.leave();
                })
            });
        });
    }
});