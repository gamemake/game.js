/*var boardcast = require('./boardcast.js');
var manager = boardcast.createManager({});

console.log(manager);
*/


var config = require('./config.js');
config.load('./config.json');

var frontend = require('./frontend_http.js');
frontend.start(config.get('frontend.ip'), config.get('frontend.port'));

var readLine = require ("readline");
if (process.platform === "win32"){
    var rl = readLine.createInterface ({
        input: process.stdin,
        output: process.stdout
    });

    rl.on ("SIGINT", function (){
        process.emit ("SIGINT");
    });
}

process.on('SIGINT',function(){
    console.log('stopping...');
    frontend.stop();
	process.exit(1);
});

process.on('exit', function() {
    console.log('exited');
});

/*
var Class = require('./class.js');

var Person = Class.extend({
	// init是构造函数
	init: function(name) {
		console.log("P:init");
		this.name = name;
	},
	getName: function() {
		console.log("P:getName");
		return this.name;
	}
});
// Employee类从Person类继承
var Employee = Person.extend({
	// init是构造函数
	init: function(name, employeeID) {
		//  在构造函数中调用父类的构造函数
		console.log("E:init");
		this._super(name);
		this.employeeID = employeeID;
	},
	getEmployeeID: function() {
		console.log("E:getEmployeeID");
		return this.employeeID;
	},
	getName: function() {
		//  调用父类的方法
		console.log("E:getName");
		return "Employee name: " + this._super();
	}
});
var zhang = new Employee("ZhangSan", "1234");
console.log(zhang.getName());   // "Employee name: ZhangSan"
*/

/*
var boardcast = require('./boardcast.js');
*/

/*
var config = require('./config.js');
config.load('./config.json');

var userauth = require('./userauth.js');
var utils = require('./utils.js');

console.log(utils.genSessionKey('aa'));

userauth.authToken('bbb', function (user_id) {
	if(user_id==undefined) {
		console.log('failed');
	} else {
		console.log(user_id);
	}
	process.exit();
});
*/
/*
var cluster = require('cluster');

if (cluster.isMaster) {
	console.log('I am master');

	cluster.on('fork', function (worker) {
		console.log('EVENT(fork) ' + worker.id);
	});
	cluster.on('online', function (worker) {
		console.log('EVENT(online) ' + worker.id);
	});
	cluster.on('listening', function (worker, address) {
		console.log('EVENT(listening) ' + worker.id);
	});
	cluster.on('disconnect', function (worker) {
		console.log('EVENT(disconnect) ' + worker.id);
	});
	cluster.on('exit', function (worker) {
		console.log('EVENT(exit) ' + worker.id);
		var worker1 = cluster.fork();
		worker1.on('message', function (msg) {
			console.log('msg master ' + JSON.stringify(msg));
			worker1.send(msg);
		});
		worker1.send('hello');
	});

	var worker;
	for(i=0; i<2; i++) {
		worker = cluster.fork();
		worker.on('message', function (msg) {
			console.log('msg master ' + JSON.stringify(msg));
			worker.send(msg);
		});
		worker.send('hello');
	}
} else if (cluster.isWorker) {
	var count = 0;
	console.log('I am worker #' + cluster.worker.id);
	process.on('message', function(msg) {
		count++;
		console.log('msg ' + cluster.worker.id + ' ' + msg);
		process.send(msg);
		if(count>10) {
			process.exit(0);
		}
	});
}
*/
/*

var aa = [100, 200];

for(var k,v  in aa) {
	console.log(k);
	console.log(v);
}

for(i=0; i<aa.length; i++) {
	console.log(aa[i]);
}

function AAAA()
{
	this.bbb = 1;
}

var a = new AAAA();
var b = a;
b.bbb = 100;
console.log(JSON.stringify(a));

var map = {};
map['aaaa'] = 100;

console.log(typeof(map['bbbb']));

console.log(JSON.stringify(map));

var aaa = [];
aaa.push(1000);

console.log(aaa.pop())
console.log(aaa.pop())
*/
