const { app } = require('@azure/functions');

const JsReport = require('jsreport')
const path = require('path')
const fse = require('fs-extra')
const os = require('os')
const chromium = require("@sparticuz/chromium")
chromium.setHeadlessMode = true


let jsreport
const init = (async () => {    
    // precreate cache to skip crawling the directories when finding extensions
    // this may speed up the cold start by ~1s
    precreateExtensionsLocationsCache()

    console.log('creating jsreport')
    jsreport = JsReport({
        configFile: path.join(__dirname, '../../', 'prod.config.json'),
        chrome: {
            launchOptions: {
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
                ignoreHTTPSErrors: true,
            }         
        }
    })    
    await fse.copy(path.join(__dirname, '../../', 'data'), '/tmp/data')
   
    return jsreport.init()
})().catch((err) => {
    console.error('Failed to initialize jsreport', err)
    throw err
})

app.http('MyHttpTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const bodyStr = await request.text()           
            await init       
            // use the request body from post, if not specified return a sample template report for preview in browser
            const res = await jsreport.render(bodyStr ? JSON.parse(bodyStr) : {
                template: {
                    name: 'invoice-main'
                }
            })
            
            return { body:  res.content }            
        } catch (e) {
            console.warn(e)
            return {
                status: 400,
                body: e.stack
            };
        }         
    }
})

function precreateExtensionsLocationsCache() {    
    const rootDir = path.join(path.dirname(require.resolve('jsreport')), '../../')    
    const locationsPath = path.join(rootDir, 'locations.json')    
    
    if (fse.existsSync(locationsPath)) {
        console.log('locations.json found, extensions crawling will be skipped')
        const locations = JSON.parse(fse.readFileSync(locationsPath)).locations
        const tmpLocationsPath = path.join(os.tmpdir(), 'jsreport', 'core', 'locations.json')

        fse.ensureFileSync(tmpLocationsPath)       
        fse.writeFileSync(tmpLocationsPath, JSON.stringify({
            [path.join(rootDir, 'node_modules') + '/']: {
                rootDirectory: rootDir,
                locations: locations.map(l => path.normalize(path.join(rootDir, l).replace(/\\/g, '/'))),
                lastSync: Date.now()
            }
        }))       
    } else {
        console.log('locations.json not found, the startup will be a bit slower')
    }
}