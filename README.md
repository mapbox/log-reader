# log-reader


## API

`reader = LogReader(filename)`

Initialize a log reader given the specified filename.

`reader.read(callback, depth)`

Start to read the log into a stream. `depth` allows you to stream less
than all of the log. Calls `callback` with `err, path`.

## Example

```js
var reader = new LogReader(options.log).read();

return function(cb) {
    reader.read(function(err, path) {
        if (err) throw err;
        return cb(formatter(path));
    });
};
```
