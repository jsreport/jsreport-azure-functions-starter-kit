const JsReport = require('jsreport')
const path = require('path')
const fse = require('fs-extra')

let jsreport
const init = (async () => {    
    jsreport = JsReport({
        configFile: path.join(__dirname, '../', 'prod.config.json')
    })    
    await fse.copy(path.join(__dirname, '../', 'data'), '/tmp/data')
    return jsreport.init()
})()

module.exports = async function (context, req) {
    try {
        await init
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