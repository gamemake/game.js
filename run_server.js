
var http = require('http');
var atlas = require('./atlas_server.js');

http.createServer(function (req, res) {
    atlas.process(req, res);
}).listen(1980, '0.0.0.0');

console.log('server started.');
