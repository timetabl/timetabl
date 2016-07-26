'use strict';

const Q = require('q');
const Router = require('express').Router;

function promised(callback) {
  return (req, res, next) => Q.when(req, callback).then(value => {
    if (value === 401) {
      return res.status(401).render('unauthorized');
    } else if (typeof value === 'number') {
      return res.sendStatus(value);
    } else if (typeof value === 'string') {
      return res.render(value);
    } else if (typeof value !== 'object') {
      throw Error;
    } else {
      Object.keys(value).forEach(function(key) {
        switch (key) {
          case 'status':
            return res.status(value[key]);
          case 'expires':
            res.set('Expires', new Date(Date.now() + value[key] * 1000).toUTCString());
            return res.set('Cache-Control', "private,max-age=" + value[key]);
          case 'redirect':
            return res.redirect(303, value[key]);
          case 'json':
            return res.json(value[key]);
          case 'render':
            if (value[key] instanceof Array) {
              return res.render(value[key][0], value[key][1]);
            } else {
              return res.render(value[key], value.locals);
            }
            break;
          case 'locals':
            break;
          default:
            throw Error("unknown key: " + key);
        }
      });
      return res.end();
    }
  }).fail(next);
}

module.exports = exports = () => {
  var router = Router();
  for (let method of 'get,post'.split(',')) {
    router["q" + method] = (path, callback) => router[method](path, promised(callback));
  }
  return router;
};
