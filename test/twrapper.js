const { setupLoader } = require('@openzeppelin/contract-loader');

const coverage = process.env.TEST_ENV_COVERAGE !== undefined;

const artifactsDir = coverage ? `${__dirname}/../.coverage_artifacts/contracts` : `${__dirname}/../build/contracts/`;

let provider;

const testHelpers = require('@openzeppelin/test-environment');
const testEnvironmentConfig = require('../test-environment.config');

global.accounts = testHelpers.accounts;
global.defaultSender = testHelpers.defaultSender;

if (global.web3) {
  provider = testEnvironmentConfig.setupProvider(web3.currentProvider);
} else {
  global.web3 = testHelpers.web3;
  provider = testHelpers.provider;
}

const truffleLoader = setupLoader({
  provider, // either a web3 provider or a web3 instance
  // defaultSender: // optional
  defaultGas: coverage ? 0xffffffffff : 8000000, // optional, defaults to 8 million
  gasPrice: 1,
  artifactsDir
}).truffle;

const loaderWrapper = {
  contracts: [],
  fromAbi(...args) {
    const contract = truffleLoader.fromAbi(...args);
    loaderWrapper.contracts.push(contract);
    return contract;
  },
  fromArtifact(...args) {
    const contract = truffleLoader.fromArtifact(...args);
    loaderWrapper.contracts.push(contract);
    return contract;
  }
};

if (global.before) {
  before(async function() {
    loaderWrapper.contracts.forEach(contract => {
      contract.setProvider(provider);
      contract.defaults({
        from: testHelpers.defaultSender
      });
    });
  });
}

module.exports = {
  contract: loaderWrapper,
  artifactsDir
};
