/*
 * Copyright ©️ 2020 Curio AG (Company Number FL-0002.594.728-9)
 * Incorporated and registered in Liechtenstein
 *
 * Copyright ©️ 2020 Curio Capital AG (Company Number CHE-211.446.654)
 * Incorporated and registered in Zug, Switzerland.
 */

const HDWalletProvider = require('@truffle/hdwallet-provider');
const web3 = require('web3');

function getProvider(rpc) {
  return function() {
    const provider = new web3.providers.WebsocketProvider(rpc);
    return new HDWalletProvider(process.env.DEPLOYMENT_KEY, provider);
  };
}

const config = {
  networks: {
    soliditycoverage: {
      host: '127.0.0.1',
      port: 8555,
      gasLimit: 9600000,
      network_id: '*'
    },
    local: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*'
    },
    kovan: {
      gasPrice: 1000 * 1000 * 1000,
      gasLimit: 10 * 1000 * 1000,
      provider: getProvider('wss://wss-rpc.kovan.galtproject.io'),
      // provider: getProvider('https://kovan.poa.network'),
      // provider: getProvider('wss://kovan.infura.io/ws/v3/83ea24ff57c3420abe37f03312bbafc1'),
      websockets: true,
      skipDryRun: true,
      network_id: '42'
    },
    test: {
      // https://github.com/trufflesuite/ganache-core#usage
      provider() {
        // eslint-disable-next-line global-require
        const { provider } = require('@openzeppelin/test-environment');
        return provider;
      },
      skipDryRun: true,
      network_id: '*'
    }
  },
  mocha: {
    timeout: 10000
  },
  compilers: {
    solc: {
      version: process.env.SOLC || '0.5.17',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      },
      evmVersion: 'istanbul'
    }
  },
  plugins: ['solidity-coverage']
};

module.exports = config;
