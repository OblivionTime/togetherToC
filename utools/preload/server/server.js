/*
 * @Description: 
 * @Version: 1.0
 * @Autor: solid
 * @Date: 2022-12-12 13:34:12
 * @LastEditors: solid
 * @LastEditTime: 2022-12-12 14:04:34
 */

const router = require('./router');
let Status = false


const startServer = () => {
    const app = router.initApp()
    server = app.listen("1015", () => {
        console.log("start success! download url: 127.0.0.1:1015")
        Status = true
    })
}
const getServerStatus = () => {
    return Status;
}

exports.startServer = startServer
exports.getServerStatus = getServerStatus