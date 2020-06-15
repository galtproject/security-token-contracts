// eslint-disable-next-line import/order
const { contract, artifactsDir } = require('../test/twrapper');
// eslint-disable-next-line import/order
const { ZWeb3, SimpleProject, Contracts } = require('@openzeppelin/upgrades');

const ozWeb3 = web3;

module.exports = function() {
  const getContract = Contracts.getFromLocal.bind(contract);
  const getResultContract = contract.fromArtifact.bind(contract);

  // eslint-disable-next-line
  Contracts.buildDir = Contracts.DEFAULT_BUILD_DIR = artifactsDir;

  ZWeb3.initialize(ozWeb3.currentProvider);
  const CarToken = getResultContract('CarToken');
  const TokenReserve = getContract('TokenReserve');
  const CarTokenController = getContract('CarTokenController');

  TokenReserve.numberFormat = 'String';
  CarToken.numberFormat = 'String';

  return {
    async deployWhitelistedTokenSale(from, proxyAdmin) {
      const curioProject = new SimpleProject('Curio', null, { from });

      const tokenController = await curioProject.createProxy(CarTokenController, {
        initArgs: [from],
        admin: proxyAdmin,
        contractName: 'CarTokenController'
      });

      const token = await CarToken.new(tokenController._address, tokenController._address, tokenController._address, {
        from
      });

      const tokenReserve = await curioProject.createProxy(TokenReserve, {
        initArgs: [from, token.address],
        admin: proxyAdmin,
        contractName: 'TokenReserve'
      });

      return {
        token: await getResultContract('CarToken').at(token.address),
        tokenController: await getResultContract('CarTokenController').at(tokenController._address),
        tokenReserve: await getResultContract('TokenReserve').at(tokenReserve._address)
      };
    }
  };
};
