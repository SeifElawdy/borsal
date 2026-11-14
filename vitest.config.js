module.exports = {
  test: {
    // DB integration and vision tests share fixtures/uploads: run files sequentially.
    fileParallelism: false,
    // Source packages may be extracted under ignored data/ for verification.
    // Never rediscover those historical test copies as current regression tests.
    exclude: ['**/node_modules/**', '**/.git/**', 'data/**'],
    reporters: ['verbose'],
  },
};
