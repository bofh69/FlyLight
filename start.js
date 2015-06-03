#!/usr/bin/env node

forever = require('forever');

forever.start('server.js', {
    root: 'logs',
    args: process.argv.slice(2)
});
