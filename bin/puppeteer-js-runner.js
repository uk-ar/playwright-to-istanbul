#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright')
require('yargs') // eslint-disable-line
  .usage('$0 <input> <output>', 'output coverage data from playwright', (yargs) => {
    yargs
      .positional('input', {
        default: 'test/sample_js/sample1.js',
        describe: 'file to load into headless chromium'
      })
      .positional('output', {
        default: 'test/fixtures/out.json'
      })
  }, (argv) => {
    outputPlaywrightCoverage(
      path.resolve(process.cwd(), argv.input),
      path.resolve(process.cwd(), argv.output)
    )
  })
  .help()
  .demandCommand(1)
  .argv

async function outputPlaywrightCoverage (input, output) {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  // Enable both JavaScript and CSS coverage
  await Promise.all([
    page.coverage.startJSCoverage({ resetOnNavigation: false }),
    page.coverage.startCSSCoverage({ resetOnNavigation: false })
  ])

  // Script src goes up two directories, since it is in /bin/tmp
  // This makes it so the script is specified from the project directory level
  // <script src='../../${input}'></script>
  // node bin/puppeteer-js-runner.js ./test/sample_js/block-else-not-covered.js ./test/fixtures/inline-and-external-script-coverage.json
  const pageHtml = `
  <html>
  <head>
    <script>
    function c(num1, num2) {
  return num2 * num1;
}
function d(num3) {
  return num3;
}
c(4,3);
    </script>
    <script>
    function e(num4, num5, num6) {
  return num4 * num5 - num6;
}
e(3,5,6);
    </script>
  </head>
  </html>`

  fs.writeFileSync('/tmp/playwrightTemp.html', pageHtml, 'utf8')

  // Navigate to page
  // let url = 'file:///' + '/tmp/playwrightTemp.html'
  const url = 'http://' + 'localhost:8099/hello.erb'
  await page.goto(url)
  // node bin/puppeteer-js-runner.js ./test/sample_js/function-coverage-100.js ./test/fixtures/function-coverage-full-duplicate.json
  // node bin/puppeteer-js-runner.js ./test/sample_js/function-coverage-100.js ./test/fixtures/function-coverage-full-duplicate.json
  // await page.goto(url)

  // Disable both JavaScript and CSS coverage
  const [jsCoverage, cssCoverage] = await Promise.all([
    page.coverage.stopJSCoverage(),
    page.coverage.stopCSSCoverage()
  ])

  fs.writeFileSync(output, JSON.stringify([...jsCoverage, ...cssCoverage], null, 2), 'utf8')
  await browser.close()
}
