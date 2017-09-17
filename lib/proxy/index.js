'use strict';

const { Reader: reader, Either } = require('monet');
const { ifElse } = require('ramda');
const { isNull } = require('ramda-adjunct');
const { FLutureTMonetEither: FutureTEither } = require('monad-t');
const express = require('express');
const Boom = require('boom');

const proxyFactory = require('./proxyFactory');

// TODO: Figure WS proxying in current approach

const middleWareFactory = dal => (req, res, next) =>
  FutureTEither(dal.domain.findByFQDN(req.hostname))
    .mapRej(error => Boom.badImplementation(error.message))
    .chainEither(ifElse(isNull, Either.Left, Either.Right))
    .fork(next, proxyFactory(req, res));

const notFoundFactory = () => (req, res, next) => next(Boom.notFound());

// eslint-disable-next-line no-unused-vars
const errorHandlerFactory = () => (error, req, res, next) => {
  if (error.isBoom) {
    res.sendStatus(error.output.statusCode);
  } else {
    res.sendStatus(500);
  }
};

const appFactory = middleware => express()
  .use(middleware)
  .use(notFoundFactory())
  .use(errorHandlerFactory());

const createApp = () => reader(
  ({ dal }) => appFactory(middleWareFactory(dal))
);

module.exports = {
  createApp,
};
