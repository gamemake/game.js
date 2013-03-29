var querystring = require('querystring');
var url = require('url');

var methods = {
    'login' : function (args, res)
    {
        res.writeHead(200);
        res.end('done');
    },
    'logout' : function (args, res)
    {
        res.writeHead(200);
        res.end('done');
    },
    'request' : function (args, res)
    {
        res.writeHead(200);
        res.end('done');
    }
};

function process(req, res)
{
    url_parts = url.parse(req.url);
    path = url_parts.pathname;
    if(path.substring(0, 11)=='/atlas-api/') {
        var method = path.substring(11);
        if(methods.hasOwnProperty(method)) {
            if(req.method=='POST') {
                var info = "";
                req.addListener('data', function(chunk) {w
                    info += chunk;
                });
                req.addListener('end', function() {
                    args = querystring.parse(info);
                    methods[method](args, res);
                });
                return;
            }
            if(req.method=='GET') {
                var args = {};
                if(url_parts.query!=undefined) {
                    args = querystring.parse(url_parts.query);
                }
                methods[method](args, res);
                return;
            }
        }
    }

    res.writeHead(404);
    res.end();
}

module.exports.process = process;
