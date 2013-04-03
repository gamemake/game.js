var querystring = require('querystring');
var url = require('url');
var utils = require('./utils.js')
var userauth = require('./userauth.js');

function method_login(_this, args, res)
{
    if(typeof(args.token)!='string') {
        res.writeHead(200);
        res.end('ERROR=INVALID_PARAMETER');
        return;
    }
    userauth.authToken(args.token, function(user_id) {

    });
    var token = _this.user_map[args.token];
    if(token!=undefined) {
        _this.token_map[token] = undefined;
    }
    token = 'TOKEN'+_this.token_seq;
    _this.token_seq += 1;
    _this.user_map[args.token] = token;
    _this.token_map[token] = args.token;
    res.writeHead(200);
    res.end('ERROR=0;{"session_key":"'+token+'"}');
}

function method_logout(_this, args, res)
{
    var session_key = args.session_key;
    if(typeof(session_key)!='string') {
        res.writeHead(200);
        res.end('ERROR=INVALID_SESSION');
        return;
    }
    res.writeHead(200);
    res.end('ERROR=0');
}

function method_request(_this, args, res)
{
    var session_key = args.session_key;
    if(typeof(session_key)!='string') {
        res.writeHead(200);
        res.end('ERROR=INVALID_SESSION');
        return;
    }
    var request = args.request;
    if(typeof(request)!='string') {
        res.writeHead(200);
        res.end('ERROR=INVALID_PARAMETER');
        return;
    }
    request = JSON.parse(request);
    var method = request.method;
    if(typeof(method)!='string') {
        res.writeHead(200);
        res.end('ERROR=INVALID_PARAMETER');
        return;
    }
    var message = request.message;
    if(typeof(message)!='object') {
        res.writeHead(200);
        res.end('ERROR=INVALID_PARAMETER');
        return;
    }

    console.log(method+'='+JSON.stringify(message));
    res.writeHead(200);
    res.end('ERROR=0;{"response":[]}');
}

function method_pullmessage(_this, args, res)
{

}

var methods = {
    'login'         : method_login,
    'logout'        : method_logout,
    'request'       : method_request,
    'pullmessage'   : method_pullmessage
};

function AtlasServer
{
    this.user_map = {};
    this.session_map = {};
}

AtlasServer.process = function(req, res)
{
    url_parts = url.parse(req.url);
    path = url_parts.pathname;
    if(path.substring(0, 11)=='/atlas-api/') {
        var method = methods[path.substring(11)];
        if(method!=undefined) {
            if(req.method=='POST') {
                var info = "";
                req.addListener('data', function(chunk) {
                    info += chunk;
                });
                req.addListener('end', function() {
                    args = querystring.parse(info);
                    method(this, args, res);
                });
                return;
            } else if(req.method=='GET') {
                var args = {};
                if(url_parts.query!=undefined) {
                    args = querystring.parse(url_parts.query);
                }
                method(this, args, res);
                return;
            }
        }
    }

    res.writeHead(404);
    res.end();
}

AtlasServer.register = function(name, funcmap)
{
}

module.exports.process = process;
