const DefaultStrategy = require('./default');
const MinerUStrategy = require('./mineru');
const VisionStrategy = require('./vision');

module.exports = {
    default: DefaultStrategy,
    mineru: MinerUStrategy,
    vision: VisionStrategy
  };