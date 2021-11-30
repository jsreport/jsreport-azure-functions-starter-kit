const axios = require('axios')
const fs = require('fs')
const concat = require('concat-stream')

const AZURE_FUNCTION_TRIGGER_URL = 'https://jsrtest.azurewebsites.net/api/httptrigger1'

async function test() {
    console.time('test')   
    try {
        const res = await axios({
            url: AZURE_FUNCTION_TRIGGER_URL,
            method: 'post',                
            data: {
                template: {
                    name: 'orders-main',                    
                }
            },
            responseType: 'stream'
        })   
        res.data.pipe(fs.createWriteStream('out.pdf'))    
        console.timeEnd('test')
    } catch (e) {
        console.error(e.message)      
        if (e.response) { 
            const responseBuffer = await streamToBuffer(e.response.data)                  
            console.error(responseBuffer.toString())
        }
    }
}

function streamToBuffer (response) {
    return new Promise((resolve, reject) => {        
        const writeStream = concat((data) => resolve(data))
        response.on('error', reject)
        response.pipe(writeStream)
    })
}


test().catch(console.error)