'use strict';

const { ifElse, always, when, equals, not, toLower, defaultTo } = require('ramda');
const { isNilOrEmpty } = require('ramda-adjunct');

const APP = {
  httpPort: ifElse(isNilOrEmpty, always(8080), Number)(process.env.HTTP_PORT),
  httpPorts: ifElse(isNilOrEmpty, always(8443), Number)(process.env.HTTPS_PORT),
};

const DB = {
  host: when(isNilOrEmpty, always('localhost'))(process.env.REDIS_HOST),
  port: ifElse(isNilOrEmpty, always(6379), Number)(process.env.REDIS_PORT),

  domainCollection: when(isNilOrEmpty, always('domains'))(process.env.REDIS_DOMAIN_COL),
};

const ENV = {
  production: equals('production', toLower(defaultTo('', process.env.NODE_ENV))),
  development: not(equals('production', toLower(defaultTo('', process.env.NODE_ENV)))),
};

const LE = {
  staging: 'staging',
  production: 'https://acme-v01.api.letsencrypt.org/directory',
  email: defaultTo('johndoe', process.env.LE_EMAIL),
};

LE.current = ENV.production ? LE.production : LE.staging;

module.exports = {
  APP,
  DB,
  ENV,
  LE,
};
