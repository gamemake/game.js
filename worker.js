
var config = require('./config.js');
var cluster = require('cluster');
var isClusterMode = config.get('worker.isClusterMode');
var callbacks = {};
var users = {};

module.exports.on = function (prefix, callback)
{
    callbacks[prefix] = callback;
}

module.exports.queue = function (uid, cmd, args)
{
    if(isCluterMode) {
        if(cmd=='login') {
        } else {
        }
        if(cmd=='logout') {
        }
    } else {
        var arr = cmd.split('.');
        if(arr.length<1) {
            // throw exception invalid command name
            return;
        }

        var callback = callbacks[arr[0]];
        if(callback==undefined) {
            // throw exception command not found
            return;
        }

        callback(cmd);
    }
}
