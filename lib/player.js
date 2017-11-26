var playQueue = [];
var isPlaying = false;
var currentPlay = null;

exports.add = function(path, voiceChannel)
{
    playQueue.push({path: path, voiceChannel: voiceChannel});

    if(!isPlaying)
    {
        play();
    }
}

exports.kill = function(next)
{
    if(!isPlaying)
    {
        next(false);
        return;
    }

    playQueue = [];
    currentPlay.voiceChannel.leave();
    isPlaying = false;
    next(true);
}

var play = function()
{
    isPlaying = true;

    currentPlay = playQueue.pop();

    // Join voice channel and play the sound!
    currentPlay.voiceChannel.join().then(connection => {
        var dispatcher = connection.playFile(currentPlay.path);

        dispatcher.on("end", end => {
            if(playQueue.length > 0)
            {
                play();
            }
            else
            {
                currentPlay.voiceChannel.leave();
                isPlaying = false;
            }
        })
    });
}