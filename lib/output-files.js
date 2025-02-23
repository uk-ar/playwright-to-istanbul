// output JavaScript bundled in puppeteer output to format
// that can be eaten by Istanbul.

// TODO: Put function interfaces on this file

const fs = require('fs')
const mkdirp = require('mkdirp')
const clone = require('clone')
const pathLib = require('path')
const url = require('url')

let iterator = {}

class OutputFiles {
  constructor (coverageInfo, options = {}) {
    this.storagePath = options.storagePath || './.nyc_output/js'
    this.includeHostname = Object.prototype.hasOwnProperty.call(options, 'includeHostname') ? options.includeHostname : true

    // Clone coverageInfo to prevent mutating the passed in data
    this.coverageInfo = clone(coverageInfo)
    this._parseAndIsolate()
  }

  parsePath (path) {
    let urlPath

    try {
      urlPath = new url.URL(path)
    } catch (error) {
      path = 'file://' + path
      urlPath = new url.URL(path)
    }

    let postProtocolPath = urlPath.pathname.substring(1)

    if (urlPath.hostname && this.includeHostname) {
      let hostnameAndPort = urlPath.hostname
      if (urlPath.port) {
        hostnameAndPort = hostnameAndPort + '_' + urlPath.port
      }

      postProtocolPath = hostnameAndPort + '/' + postProtocolPath
    }

    return postProtocolPath
  }

  rewritePath (path) {
    // generate a new path relative to ./coverage/js.
    // this would be around where you'd use mkdirp.

    let parsedPath = this.parsePath(path)
    // Special case: when html present, strip and return specialized string
    /* if (pathLib.extname(parsedPath) === '.html') {
      isInline = true
      parsedPath = pathLib.resolve(this.storagePath, parsedPath + 'puppeteerTemp-inline')
    } else {
      parsedPath = pathLib.resolve(this.storagePath, pathLib.dirname(parsedPath), pathLib.basename(parsedPath, '.js'))
    } */
    parsedPath = pathLib.resolve(this.storagePath, pathLib.dirname(parsedPath), pathLib.basename(parsedPath))
    const dir = pathLib.dirname(parsedPath)
    const ext = pathLib.extname(parsedPath)
    // instanbul works with only ".js" ext.
    if (ext !== '.js') {
      parsedPath = parsedPath + '.js'
    }
    mkdirp.sync(dir)
    // return parsedPath
    // mkdirp.sync(this.storagePath)
    // if (fs.existsSync(parsedPath + '.js') && isInline) {
    // console.log(pathLib.extname(parsedPath));
    if (fs.existsSync(parsedPath) && ext !== '.js' && ext !== '.css') {
      if (!Number.isInteger(iterator[parsedPath])) {
        iterator[parsedPath] = 1
      } else {
        iterator[parsedPath]++
      }
      // console.log(pathLib.basename(parsedPath, ext) + "-" + iterator[parsedPath] + ext);
      return pathLib.format({ // foo.html.js
        dir, base: pathLib.basename(parsedPath, '.js') + '-' + iterator[parsedPath] + '.js'
      })
    } else {
      return parsedPath
      // return `${parsedPath}-${iterator[parsedPath]}`
    }
    /* if (fs.existsSync(parsedPath + '.js') && isInline) {
      if (!Number.isInteger(iterator[parsedPath])) {
        iterator[parsedPath] = 1
      } else {
        iterator[parsedPath]++
      }
      str = `${parsedPath}-${iterator[parsedPath]}.js`
      return str
    } else {
      str = `${parsedPath}.js`
      return str
    } */
  }

  async _parseAndIsolate () {
    for (let i = 0; i < this.coverageInfo.length; i++) {
      const path = this.rewritePath(this.coverageInfo[i].url)

      this.coverageInfo[i].originalUrl = this.coverageInfo[i].url
      this.coverageInfo[i].url = path

      mkdirp.sync(pathLib.parse(path).dir)

      /* const response = await fetch(this.coverageInfo[i].originalUrl)
      const text = await response.text()
      fs.writeFileSync(path, text) */
      if (this.coverageInfo[i].source) { fs.writeFileSync(path, this.coverageInfo[i].source) } else { fs.writeFileSync(path, this.coverageInfo[i].text) }
    }
  }

  getTransformedCoverage () {
    return this.coverageInfo
  }
}

function genOutputFiles (coverageInfo, options) {
  return new OutputFiles(coverageInfo, options)
}

genOutputFiles.resetIterator = function () {
  iterator = {}
}

module.exports = genOutputFiles
