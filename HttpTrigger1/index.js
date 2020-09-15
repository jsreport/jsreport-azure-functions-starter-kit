const JsReport = require('jsreport')
const path = require('path')
const ncp = require('ncp')

let jsreport
const init = (async () => {    
    jsreport = JsReport({
        configFile: path.join(__dirname, '../', 'prod.config.json')
    })    
    await ncp(path.join(__dirname, '../', 'data'), '/tmp/data')
    return jsreport.init()
})()

module.exports = async function (context, req) {
    await init

    try {
        // use the request body from post, if not specified return a sample template report for preview in browser
        const res = await jsreport.render(req.body || {
            template: {
                name: 'invoice-main'
            }
        })
        
        context.res = {        
            body: res.content
        };
    } catch (e) {
        console.warn(e)
        context.res = {
            status: 400,
            body: e.stack
        }
    }    
}