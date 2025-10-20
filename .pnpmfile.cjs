// pnpm hook file to allow native module builds
module.exports = {
  hooks: {
    readPackage(pkg) {
      // Allow better-sqlite3 to build
      if (pkg.name === 'better-sqlite3') {
        pkg.scripts = pkg.scripts || {};
        pkg.scripts.install = pkg.scripts.install || 'node-gyp rebuild';
      }
      return pkg;
    }
  }
};
