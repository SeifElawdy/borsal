module.exports = {
  test: {
    // DB integration and vision tests share fixtures/uploads: run files sequentially.
    fileParallelism: false,
    reporters: ['verbose'],
  },
};
