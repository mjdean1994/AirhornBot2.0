const fs = require("fs");
const http = require("http");

var sounds = require("../data/sounds.json");

function addSound(guild, name, attachment, next) {
    if (!validateAttachment(attachment)) {
        next({
            "code": "InvalidFileType",
            "message": "File type is invalid."
        });
        return;
    }

    if (!sounds.hasOwnProperty(guild)) {
        initializeDefaultSounds(guild, function () {
            downloadSoundFile(guild, name, attachment, function (path, err) {
                if(err)
                {
                    next(err);
                }
                sounds[guild][name] = path;
            });
        });
    }
    else {
        if (!sounds[guild].hasOwnProperty(name)) {
            next({
                "code": "SoundAlreadyExists",
                "message": "A sound with this name already exists for this server."
            });
        }
        else {
            downloadSoundFile(guild, name, attachment, function (path, err) {
                if(err)
                {
                    next(err);
                }
                sounds[guild][name] = path;
            });
        }
    }
}

function downloadSoundFile(guild, name, attachment, next) {
    var path = "./sounds/" + guild + "/" + attachment.filename;

    var file = fs.createWriteStream(path);
    var request = http.get(attachment.url, function (response) {
        response.pipe(file);
        file.on("finish", function () {
            file.close(next);
        }).on("error", function (err) {
            fs.unlink(path);
            next("", err);
        });
    });
}

function getSoundPath(guild, name, done) {
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
        initializeDefaultSounds(guild, function () {
            retrieveCandidate();
        });
    }
    else {
        retrieveCandidate();
    }
}

function initializeDefaultSounds(guild, next) {
    if (sounds.hasOwnProperty(guild)) {
        var err = "I've already been initialized on this server. Go ahead, use me! Try `!airhorn` now!";
        next(err);
    }

    sounds[guild] = {};
    save(next);
}

function validateAttachment(candidate) {
    var extension = candidate.filename.split(".")[1].toLowerCase();

    if (extension === "mp3" || extension === "wav") {
        return true;
    }
    return false;
}

function save(next) {
    fs.writeFile("./data/sounds.json", JSON.stringify(sounds), "utf8", (err) => {
        if (err) throw err;
        next();
    })
}