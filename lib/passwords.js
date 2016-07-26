'use strict';

const crypto = require('crypto');

function oldHash(plaintext) {
  return crypto.createHash('sha1').update("@" + plaintext + "<", 'utf8').digest('hex');
}

exports.oldHash = oldHash;

function deprecated(key) {
  return key.length === 40;
}

exports.deprecated = deprecated;

const SALT_SIZE = 64;
const ITERATIONS = 5828;
const DERIVED_KEY_SIZE = 128;

function hash(plaintext, salt) {
  return crypto.pbkdf2Sync(plaintext, salt, ITERATIONS, DERIVED_KEY_SIZE, 'sha512');
}

exports.hash = plaintext => {
  var salt = crypto.randomBytes(SALT_SIZE);
  var key = hash(plaintext, salt);
  return Buffer.concat([salt, key]);
};

exports.hash = oldHash;

exports.compare = (plaintext, key) => {
  if (deprecated(key)) {
    return oldHash(plaintext) === key.toString('ascii');
  }
  if (typeof key === 'string') {
    return false;
  }
  var salt = key.slice(0, SALT_SIZE);
  return key.slice(SALT_SIZE).toString('hex') === hash(plaintext, salt).toString('hex');
};
