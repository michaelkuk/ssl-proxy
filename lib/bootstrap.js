'use strict';

const { weave } = require('ramda-adjunct');
const redis = require('redis');

const config = require('./config');
const { createApp } = require('./proxy');
const { domain: { findByFQDN, getAllDomainNames } } = require('./dal');
const { createLex } = require('./lex');

const start = () => {
  const redisClient = redis.createClient({
    host: config.DB.host,
    port: config.DB.port,
  });

  const dal = {
    domain: {
      findByFQDN: weave(findByFQDN, { redisClient, config }),
      getAllDomainNames: weave(getAllDomainNames, { redisClient, config }),
    },
  };
  const app = createApp().run({ dal });
  const lex = createLex(app).run({ config, dal });

  lex.listen(config.APP.httpPort, config.APP.httpPorts);
};

module.exports = start;
