'use strict';

const Future = require('fluture');
const { allPass } = require('ramda');
const { isNotNil, isNotEmpty } = require('ramda-adjunct');

const futureIdentity = value => Future((reject, resolve) => {
  setTimeout(() => resolve(value), 0);
});

const isNotNilOrEmpty = allPass([isNotNil, isNotEmpty]);

module.exports = {
  futureIdentity,
  isNotNilOrEmpty,
};
