/*
 * Copyright ©️ 2020 Curio AG (Company Number FL-0002.594.728-9)
 * Incorporated and registered in Liechtenstein
 *
 * Copyright ©️ 2020 Curio Capital AG (Company Number CHE-211.446.654)
 * Incorporated and registered in Zug, Switzerland.
 */

const { accountsConfig } = require('@openzeppelin/test-environment/lib/accounts');
module.exports = {
  testrpcOptions: "-p 8555 -e 500000000 -a 35",
  skipFiles: ['Migrations.sol', 'mocks'],
  providerOptions: {
    gasPrice: 1,
    accounts: accountsConfig,
  },
  compileCommand: 'npm run compile',
  testCommand: "npm run ttest",
  mocha: {
    timeout: 10000
  }
};
