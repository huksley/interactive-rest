const fs = require("fs");
/*
const fsPromises = require("fs/promises");
fsPromises.opendirSync;
fsPromises.opendir = (...args) => {
  console.info("Hello", ...args);
};
*/

const orig = fs.readFileSync;
const opendirSync = fs.opendirSync;
const opendir = fs.opendir;
const readdir = fs.readdir;
const readdirSync = fs.readdirSync;
const lstat = fs.lstat;
const lstatSync = fs.lstatSync;
const stat = fs.stat;
const statSync = fs.statSync;
const dir = process.cwd();

const myfs = {
  readdir: (name, callback) => {
    if (name === dir) {
      console.info("readdir", name);
      return readdir(name, (err, files) => {
        files = [...files, "api"];
        console.info("readdir", name, files);
        callback(err, files);
      });
    } else if (name === dir + "/api") {
      const files = readdirSync("src/api");
      console.info("readdir", name, "return", files);
      return callback(null, files);
    } else {
      //console.info("readdir", name, callback);
      return readdir(name, callback);
    }
  } /*
  readdirSync: (...args) => {
    console.info("readdirSync", ...args);
    return readdirSync(...args);
  },*/,
  stat: (name, ...args) => {
    if (name === dir + "/api") {
      console.info("stat", name);
      return stat(dir, ...args);
    } else if (name.startsWith(dir + "/api/")) {
      console.info("stat", name);
      return stat(name.replace(dir, "src"), ...args);
    }
    return stat(name, ...args);
  },
  /*
  statSync: (...args) => {
    console.info("statSync", ...args);
    return statSync(...args);
  },
  lstat: (...args) => {
    console.info("lstat", ...args);
    return lstat(...args);
  },
  lstatSync: (...args) => {
    console.info("lstatSync", ...args);
    return lstatSync(...args);
  },
  opendir: (...args) => {
    console.info("opendir", ...args);
    return opendir(...args);
  },
  opendirSync: (...args) => {
    console.info("opendirSync", ...args);
    return opendirSync(...args);
  },
  readFileSync: (name, ...args) => {
    console.info("read", name);
    return orig(name, ...args);
  },*/
};

console.info("Fix APIs!", process.cwd(), process.argv0, process.argv);
if (process.argv[process.argv.length - 1] === "build") {
  const { patchFs } = require("fs-monkey");
  patchFs(myfs);
}
