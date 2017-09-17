'use strict';

const { Reader: reader, Either } = require('monet');
const leStoreRedis = require('le-store-redis');
const greenlockExpress = require('greenlock-express');
const leChallengesFs = require('le-challenge-fs');
const leChallengesSni = require('le-challenge-sni');
const {
  pathOr, concat, indexOf, filter, __, ifElse, isEmpty,
  applySpec, slice, always, curry, pipe, lt, view, lensIndex,
} = require('ramda');
const { weave } = require('ramda-adjunct');
const { FLutureTMonetEither: FutureTEither } = require('monad-t');

const { futureIdentity } = require('../util');

const createStore = () => reader(
  ({ config }) => leStoreRedis.create({
    redisOptions: {
      host: config.DB.host,
      port: config.DB.port,
    },
  })
);

const filterDomains = curry((provided, allowed) => filter(pipe(
  indexOf(__, allowed),
  lt(-1)
), provided));

const verifyDomains = domains => reader(
  ({ dal }) => FutureTEither(dal.domain.getAllDomainNames())
    .map(filterDomains(domains))
    .chainEither(ifElse(isEmpty, Either.Left, Either.Right))
);

const approve = (opts, certs, cb) => reader(
  ({ dal, config }) => {
    const vdBound = weave(verifyDomains, { dal });

    FutureTEither(futureIdentity(opts.domains))
      .map(concat(pathOr([], ['altnames'], certs)))
      .chain(vdBound)
      .map(applySpec({
        options: {
          email: always(config.LE.email),
          agreeTos: always(true),
          domain: view(lensIndex(0)),
          domains: slice(0, Infinity),
        },
        certs: always(certs),
      }))
      .fork(() => cb(new Error('Domain/s invalid')), lex => cb(null, lex));
  }
);

const getChallenges = () => ({
  'http-01': leChallengesFs.create({ webrootPath: '/tmp/acme-challenges' }),
  'tls-sni-01': leChallengesSni.create({}),
  'tls-sni-02': leChallengesSni.create({}),
});

const createLex = app => reader(
  ({ config, dal }) => {
    const store = createStore().run({ config });
    const approveDomains = weave(approve, { dal, config });
    const challenges = getChallenges();

    return greenlockExpress.create({
      server: config.LE.current,
      store,
      approveDomains,
      challenges,
      app,
      debug: config.ENV.development,
    });
  }
);

module.exports = {
  createLex,
};
