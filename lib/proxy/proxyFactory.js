'use strict';

const { curry } = require('ramda');
const httpProxy = require('http-proxy');

const proxyFactory = curry((req, res, domain) => {
  const proxy = httpProxy.createProxyServer({
    target: domain.target,
    xfwd: true,
  });

  if (domain.redirect) {
    res.redirect(domain.redirect);
  } else {
    proxy.web(req, res);
  }
});

module.exports = proxyFactory;
