/*
 * @Description: 
 * @Version: 1.0
 * @Autor: solid
 * @Date: 2022-12-14 09:54:04
 * @LastEditors: solid
 * @LastEditTime: 2022-12-14 15:48:54
 */
const WebSocket = require('ws');
const fs = require("fs")
const request = require('request');

const IPUtils = require('./IpUtil')
const SendMessage = (message, type) => {
    var ClinetWs = new WebSocket(`ws://${IPUtils.getIpAddress()}:1015/api/connection?type=self`);
    ClinetWs.on('open', function () {
        console.log("连接成功");
        console.log({ type: type, content: message });
        ClinetWs.send(JSON.stringify({ type: type, content: message }))
    });
    ClinetWs.on('error', function () {
    })
    ClinetWs.on('close', function () {
        ClinetWs = null
    })
}
const SendFile = (filename, filePath) => {
    var data = fs.readFileSync(filePath, "binary")
    const buffer = new Buffer.from(data, 'binary');
    const POST_OPTIONS = {
        port: 1015,
        host: IPUtils.getIpAddress(),
        method: 'POST',
        path: "/api/addFile",
        headers: {
            "Content-Type": 'multipart/form-data',
        },

    }
    request.post(`http://${IPUtils.getIpAddress()}:1015/api/addFile`, { formData: { file: fs.createReadStream(filePath) }, json: true }, (err, res, body) => {
        if (body.code == 200) {
            let downloadPath = `http://${IPUtils.getIpAddress()}:1015/api/download?filename=${filename}`;
            SendMessage(downloadPath, "file")
        }
    })

}
exports.SendMessage = SendMessage
exports.SendFile = SendFile