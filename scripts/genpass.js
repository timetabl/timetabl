#!/usr/bin/env node

const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Password: ', (cleartext) => {
  const hash = require('crypto').createHash('sha1');
  hash.setEncoding('hex');
  hash.write('@');
  hash.write(cleartext, 'utf8');
  hash.end('<');
  console.log(hash.read());
  rl.close();
});
