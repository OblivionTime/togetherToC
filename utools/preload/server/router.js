/*
 * @Description: 
 * @Version: 1.0
 * @Autor: solid
 * @Date: 2022-12-12 14:03:55
 * @LastEditors: solid
 * @LastEditTime: 2022-12-14 15:14:13
 */
const express = require('express');
var expressWs = require('express-ws');
const path = require('path')
const multer = require('multer')
const bodyParser = require("body-parser");
let deviceClientSet = require('./client.js').deviceClientSet;
const IPUtils = require('../utils/IpUtil');
const { url } = require('inspector');
const serverIP = IPUtils.getIpAddress()
function getCurrent() {
    var dat = new Date();
    //获取年月日，时间
    var year = dat.getFullYear();
    var mon = (dat.getMonth() + 1) < 10 ? "0" + (dat.getMonth() + 1) : dat.getMonth() + 1;
    var data = dat.getDate() < 10 ? "0" + (dat.getDate()) : dat.getDate();
    var hour = dat.getHours() < 10 ? "0" + (dat.getHours()) : dat.getHours();
    var min = dat.getMinutes() < 10 ? "0" + (dat.getMinutes()) : dat.getMinutes();
    var seon = dat.getSeconds() < 10 ? "0" + (dat.getSeconds()) : dat.getSeconds();

    var newDate = year + "-" + mon + "-" + data + " " + hour + ":" + min + ":" + seon;
    return newDate;
}
function getClientIp(req) {
    var ipAddress;
    var forwardedIpsStr = req.headers['X-Forwarded-For'];//判断是否有反向代理头信息
    if (forwardedIpsStr) {//如果有，则将头信息中第一个地址拿出，该地址就是真实的客户端IP；
        var forwardedIps = forwardedIpsStr.split(',');
        ipAddress = forwardedIps[0];
    }
    if (!ipAddress) {//如果没有直接获取IP；
        ipAddress = req.connection.remoteAddress.slice(7);
    }
    return ipAddress;
};
function getFileSuffix(path) {
    let url = path.split("?")[1];
    let params = new URLSearchParams(url);
    let filename = params.get("filename");
    let fileSuffix = filename
        .substring(filename.lastIndexOf(".") + 1)
        .toLowerCase();
    switch (fileSuffix) {
        case "avi":
        case "mpeg":
        case "wmv":
        case "mov":
        case "flv":
        case "mp4":
            return "video";
        case "png":
        case "jpeg":
        case "jpg":
        case "gif":
        case "webp":
        case "svg":
            return "images";
        default:
            return fileSuffix;
    }
}
function getRandomAvatar() {
    let rand = Math.floor(Math.random() * 42 + 1)
    return `http://${serverIP}:1015/api/avatar?filename=${rand}.jpg`
}
// 上传路径默认值
function getDefaultUploadPath() {
    let USER_HOME = process.env.HOME || process.env.USERPROFILE
    return path.join(USER_HOME, 'Downloads');
}
let chatHistory = []
const initApp = () => {
    let app = express();
    let rootPath = path.resolve(__dirname, '../..')
    app.use(express.static(path.join(rootPath, 'main')));
    expressWs(app)
    app.all("*", function (req, res, next) {
        //设置允许跨域的域名，*代表允许任意域名跨域
        res.header("Access-Control-Allow-Origin", "*");
        //允许的header类型
        res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Accept,Content-type");
        res.header("Access-Control-Allow-Credentials", true);
        //跨域允许的请求方式
        res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
        res.header("Content-Type", "application/json;charset=utf-8")
        if (req.method.toLowerCase() == 'options')
            res.sendStatus(200);  //让options尝试请求快速结束
        else
            next();
    });


    app.ws('/api/connection', function (ws, req) {
        let flag = false
        //获取name
        let url = req.url.split("?")
        if (url.length > 1) {
            flag = true
        }
        let RemoteIp = getClientIp(req)
        let avatar
        if (!deviceClientSet.client_avatar_map[RemoteIp]) {
            avatar = getRandomAvatar()
        } else {
            avatar = deviceClientSet.client_avatar_map[RemoteIp]
        }
        if (!flag || !deviceClientSet.client_avatar_map[RemoteIp]) {
            deviceClientSet.add(RemoteIp, ws, avatar)
        }
        ws.send(JSON.stringify({ self: RemoteIp, avatar: avatar }))
        for (const chat of chatHistory) {
            ws.send(JSON.stringify(chat))
        }
        //发送消息
        ws.on('message', message => {
            let data = JSON.parse(message)
            let current = getCurrent()
            let nav = {
                Sender: RemoteIp,
                type: data.type,
                SendContent: data.content,
                SendTime: current,
                avatar: avatar
            }
            if (nav.type == "file") {
                nav.fileType = getFileSuffix(nav.SendContent)
            }
            chatHistory.push(nav)
            for (const key in deviceClientSet.client_map) {
                deviceClientSet.client_map[key].send(JSON.stringify(nav))
            }
        });
        //退出
        ws.on('close', () => {
            // deviceClientSet.remove(RemoteIp)
        });
    })

    //filename
    let storage = multer.diskStorage({
        destination: function (req, file, cb) {
            // cb(null, path.join(__dirname, "../..", 'uploads'));
            cb(null, getDefaultUploadPath());
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
        }
    });

    let upload = multer({ storage: storage });
    app.post('/api/addFile', upload.single('file'), function (req, res, next) {
        res.json({ code: 200, filename: req.file.filename })
    })
    app.get('/api/download', function (req, res) {
        let filename = req.query.filename
        let filePath = path.join(getDefaultUploadPath(), filename)
        res.download(filePath)
    })
    app.get('/api/avatar', function (req, res) {
        let filename = req.query.filename
        let filePath = path.join(__dirname, "../..", 'avatar', filename)
        res.download(filePath)
    })
    return app
}

exports.initApp = initApp