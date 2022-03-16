const JsReport = require('jsreport')
const path = require('path')
const ncp = require('ncp')

const init = (() => {
    return new Promise((resolve, reject) => {        
        ncp(path.join(__dirname, '../', 'data'), '/tmp/data', function (err) {
            if (err) {
              console.error(err);
              return reject(err);
            }
            
            const jsreport = JsReport({
                configFile: path.join(__dirname, '../', 'prod.config.json')
            })            
            jsreport.init().then(() => {
                resolve(jsreport);
            })
        })
      });    
})();

module.exports = async function (context, req) {
    try {
        const jsreport = await init;
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