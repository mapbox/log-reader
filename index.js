var util = require('util'),
    fs = require('fs'),
    EventEmitter = require('events').EventEmitter;

module.exports = Reader;
function Reader(filepath) {
    this.fd = fs.openSync(filepath, 'r');
    this.size = fs.fstatSync(this.fd).size;
    this.paused = true;
    this.pos = Math.floor(Math.random() * this.size / 2);
    this.firstRead = true;
    this.paths = [];
    this.chunk = '';
    this.setMaxListeners(100);
}
util.inherits(Reader, EventEmitter);

Reader.prototype.read = function(cb, depth) {
    cb = cb || function() {};
    depth = depth || 1;
    if (depth > 2) {
        console.log("Supplied log file doesn't have enough paths");
        process.exit(1);
    }
    if (this.paths.length) {
        cb(null, this.paths.shift());

        // Maintain a buffer of 20 paths
        if (this.paths.length < 20) this._read();
        return this;
    }

    this.once('data', function() { this.read(cb, depth + 1); });
    this._read();
    return this;
};

Reader.prototype._read = function() {
    if (!this.paused) return;

    this.paused = false;
    var size = 4096 * 20;

    if (this.size < this.pos + size)
        size = this.size - this.pos;

    var buf = new Buffer(size);
    fs.read(this.fd, buf, 0, size, this.pos, function(err, bytes) {
        if (err) throw err;

        var lines = [];
        (this.chunk + buf.toString()).split("\n").forEach(function(n) {
            if (this.firstRead) this.firstRead = false;
            else if (n.length) lines.push(n);
        }.bind(this));

        this.pos += bytes;
        if (this.pos == this.size) {
            this.pos = 0;
            this.chunk = '';
        } else {
            this.chunk = this.paths.pop();
        }

        lines.forEach(function(n) {
            try {
                n = n.split('"')[1].split(' ')[1];
                if (n.indexOf('/') === 0) this.paths.push(n);
            }
            catch(e) {} // no-op
        }.bind(this));
        this.paused = true;
        this.emit('data');
    }.bind(this));
};
