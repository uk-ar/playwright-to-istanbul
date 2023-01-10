class PuppeteerToV8 {
  constructor (coverageInfo) {
    this.coverageInfo = coverageInfo
  }

  setCoverageInfo (coverageInfo) {
    this.coverageInfo = coverageInfo
  }

  convertCoverage () {
    // Iterate through coverage info and create IDs
    let id = 0
    return this.coverageInfo.map(coverageItem => {
      return {
        scriptId: id++,
        url: 'file://' + coverageItem.url,
        originalUrl: coverageItem.originalUrl,
        // functions: coverageItem.functions,
        /* functions: [{
          ranges: coverageItem.ranges.map(this.convertRange),
          isBlockCoverage: true
        }] */
        functions: coverageItem.functions
          ? coverageItem.functions
          : [{
              ranges: coverageItem.ranges.map(this.convertRange),
              isBlockCoverage: true
            }],
        source: coverageItem.source
      }
    })
  }

  // Takes in a Puppeteer range object with start and end properties and
  // converts it to a V8 range with startOffset, endOffset, and count properties
  convertRange (range) {
    return {
      startOffset: range.start,
      endOffset: range.end,
      count: 1
    }
  }
}

module.exports = (coverageInfo) => new PuppeteerToV8(coverageInfo)
