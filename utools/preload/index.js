/*
 * @Description: 
 * @Version: 1.0
 * @Autor: solid
 * @Date: 2022-12-12 13:32:09
 * @LastEditors: solid
 * @LastEditTime: 2022-12-14 15:42:41
 */
const Server = require('./server/server')
const IPUtils = require('./utils/IpUtil')
const clinet = require('./utils/clinet')
// 进入插件
utools.onPluginEnter(({ code, type, payload }) => {
    console.log("快捷方式进入插件", type, payload)

    if (!Server.getServerStatus()) {
        Server.startServer()
    }
    if (type == "over") {
        clinet.SendMessage(payload, "text")
    } else if (type == 'files') {
        for (const file of payload) {
            clinet.SendFile(file.name, file.path)
        }
    }
})

// 退出插件
utools.onPluginOut(() => {
    console.log('用户退出插件')
})
function DownloadFile(url) {
    utools.shellOpenExternal(url)
}
window.api = {
    getIpAddress: IPUtils.getIpAddress,
    DownloadFile: DownloadFile,
}