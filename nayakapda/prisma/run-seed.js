// Seed runner — uses tsconfig.seed.json (CommonJS/node resolution) to avoid bundler conflicts
require('ts-node').register({
  project: 'tsconfig.seed.json',
  transpileOnly: true,
});

require('./seed.ts');
