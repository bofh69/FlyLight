#!/usr/bin/env node

forever = require('forever');
path = require('path');

forever.start(path.resolve(__dirname, 'server.js'), {
    root: 'logs',
    args: process.argv.slice(2)
});
