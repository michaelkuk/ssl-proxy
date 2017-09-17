'use strict';

const { Reader: reader } = require('monet');
const { find, toLower, equals, defaultTo, ifElse } = require('ramda');
const { noop, isNull, weave } = require('ramda-adjunct');
const Future = require('fluture');

/**
 * @typedef {Object} Domain
 * @prop {string} fqdn
 * @prop {string} target
 * @prop {string} redirect
 */

const futureIdentity = value => Future((reject, resolve) => {
  setTimeout(() => resolve(value), 0);

  return noop;
});

const getHashKeys = hash => reader(
  ({ redisClient }) => Future((reject, resolve) => {
    redisClient.hkeys(hash, (err, reply) => {
      if (err) reject(err);
      else resolve(reply);
    });

    return noop;
  })
);

const hget = (hash, key) => reader(
  ({ redisClient }) => Future((reject, resolve) => {
    redisClient.send_command('HGET', [hash, key], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });

    return noop;
  })
);

const getAllDomainNames = () => reader(
  ({ redisClient, config }) => getHashKeys(config.DB.domainCollection)
    .run({ redisClient })
);

const findByFQDN = fqdn => reader(
  ({ redisClient, config }) => getHashKeys(config.DB.domainCollection)
    .run({ redisClient })
    .map(find(equals(toLower(fqdn))))
    .map(defaultTo(null))
    .chain(ifElse(isNull, futureIdentity, weave(hget, { redisClient })(config.DB.domainCollection)))
    .map(JSON.parse)
);

module.exports = {
  findByFQDN,
  getAllDomainNames,
};
