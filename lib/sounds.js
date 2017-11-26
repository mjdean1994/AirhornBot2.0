const fs = require("fs");
const https = require("https");

var sounds = require("../data/sounds.json");

exports.addSound = function (guild, name, attachment, next) {
    if (!validateAttachment(attachment)) {
        next({
            "code": "InvalidFileType",
            "message": "File type is invalid."
        });
        return;
    }

    if (!sounds.hasOwnProperty(guild)) {
        exports.initializeDefaultSounds(guild, function () {
            downloadSoundFile(guild, name, attachment, function (path, err) {
                if (err) {
                    next(err);
                }

                sounds[guild][name] = path;
                save(next);
            });
        });
    }
    else {
        if (sounds[guild].hasOwnProperty(name)) {
            next({
                "code": "SoundAlreadyExists",
                "message": "A sound with this name already exists for this server."
            });
        }
        else {
            downloadSoundFile(guild, name, attachment, function (path, err) {
                if (err) {
                    next(err);
                }
                
                sounds[guild][name] = path;
                save(next);
            });
        }
    }
}

exports.deleteSound = function(guild, name, next) {
    exports.getSoundPath(guild, name, function(path, err) {
        if(err)
        {
            console.log(err);
            next(err);
            return;
        }
        delete sounds[guild][name];
        fs.unlink(path);
        save(function() {
            next();
        });
    })
}

var downloadSoundFile = function (guild, name, attachment, next) {

    var filenameList = attachment.filename.split(".");
    var extension = filenameList[filenameList.length - 1].toLowerCase();

    // Name all files in format {guild}_{name} to avoid accidental overlap
    var path = "./sounds/" + guild + "/" + guild + "_" + name + "." + extension;

    var callback = function()
    {
        next(path);
    }

    var file = fs.createWriteStream(path);
    var request = https.get(attachment.url, function (response) {
        response.pipe(file);
        file.on("finish", function () {
            file.close(callback);
        }).on("error", function (err) {
            fs.unlink(path);
            next("", err);
        });
    });
}

exports.getList = function(guild, next) {
    var keys = [];
    for(var k in sounds[guild])
    {
        keys.push(k);
    }
    next(keys.sort());
}

exports.getSoundPath = function (guild, name, done) {
    var retrieveCandidate = function () {
        var candidate = sounds[guild][name];

        if (candidate) {
            done(candidate);
        }
        else {
            done("", {
                "code": "SoundNotFound",
                "message": "Unable to find sound " + name + " for guild " + guild + "."
            });
        }
    }

    if (!sounds.hasOwnProperty(guild)) {
        exports.initializeDefaultSounds(guild, function () {
            retrieveCandidate();
        });
    }
    else {
        retrieveCandidate();
    }
}

exports.initializeDefaultSounds = function (guild, next) {
    if (sounds.hasOwnProperty(guild)) {
        var err = "I've already been initialized on this server. Go ahead, use me! Try `!airhorn` now!";
        next(err);
        return;
    }

    fs.mkdirSync("./sounds/" + guild);

    sounds[guild] = {"airhorn":"./sounds/global/airhorn.wav"};
    save(next);
}

var validateAttachment = function (candidate) {
    var filenameList = candidate.filename.split(".");
    var extension = filenameList[filenameList.length - 1].toLowerCase();

    if (true || extension == "mp3" || extension == "wav") {
        return true;
    }
    return false;
}

var save = function (next) {
    fs.writeFile("./data/sounds.json", JSON.stringify(sounds), "utf8", (err) => {
        if (err) throw err;
        next();
    })
}