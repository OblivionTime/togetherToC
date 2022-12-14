<template>
  <div id="app">
    <div class="header">
      <img
        src="./assets/logo.png"
        alt=""
        style="height: 40px; margin-right: 20px"
      />
      一起聊
    </div>
    <div class="content">
      <el-card class="box-card">
        <div style="height: 80vh; width: 100%">
          <div
            style="
              display: flex;
              flex-direction: column;
              margin-bottom: 20px;
              overflow: auto;
              height: 80%;
            "
            class="story"
            ref="record"
          >
            <div
              v-for="item in chatList"
              :key="item.id"
              :style="
                item.Sender == self ? 'align-self: end;' : 'align-self: start;'
              "
              class="item"
            >
              <div
                :class="item.Sender == self ? 'sender-info' : 'receiver-info'"
              >
                <div>
                  <el-avatar
                    :src="item.Sender == self ? avatar : item.avatar"
                  ></el-avatar>
                </div>
                <div style="margin: 0 5px">
                  {{ item.Sender }}
                </div>
                <div>{{ item.SendTime }}</div>
              </div>
              <div
                :class="
                  item.Sender == self ? 'sender-content' : 'receiver-content'
                "
                :style="
                  item.fileType == 'images' || item.fileType == 'video'
                    ? 'background-color: transparent;'
                    : ''
                "
              >
                <div
                  v-if="item.type == 'text'"
                  @click="copyText(item.SendContent)"
                >
                  {{ item.SendContent }}
                </div>
                <div v-else>
                  <div v-if="item.fileType == 'images'">
                    <el-image
                      :src="item.SendContent"
                      :alt="item.SendContent"
                      style="width: 20vw; object-fit: contain"
                      :preview-src-list="[item.SendContent]"
                    />
                  </div>
                  <div v-else-if="item.fileType == 'video'">
                    <video
                      :src="item.SendContent"
                      muted
                      controls
                      style="width: 20vw; object-fit: contain"
                      @click="fullScreen($event)"
                    ></video>
                  </div>
                  <div
                    v-else
                    style="
                      display: flex;
                      justify-content: space-around;
                      align-items: center;
                    "
                    @click="downloadFile(item.SendContent)"
                  >
                    <img
                      :src="getFileIcons(item.fileType)"
                      alt=""
                      style="width: 40px; object-fit: contain"
                    />
                    <div>
                      {{ getFileName(item.SendContent) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style="height: 10vh; width: 100%">
            <div style="display: flex; justify-content: space-between">
              <div
                style="border-right: 0; cursor: pointer"
                @click="openBatchAddDialog"
              >
                <img
                  src="./assets/upload.png"
                  alt=""
                  style="max-height: 38px"
                />
              </div>
              <div>
                <el-button type="primary" @click="Send" :disabled="!content">
                  发送
                </el-button>
              </div>
            </div>
            <div>
              <el-input
                placeholder="请输入要发送的内容"
                v-model="content"
                type="textarea"
                class="input-with-select"
                style="min-height: 38px"
                :autosize="{ minRows: 1, maxRows: 4 }"
                @keyup.enter.native="Send"
                clear
              >
              </el-input>
            </div>
          </div>
        </div>
      </el-card>
    </div>
    <el-dialog
      title="发送文件"
      :visible.sync="showFormVisible"
      @closed="cancelBatchDialog"
      width="22em"
    >
      <div>
        <el-upload
          action="#"
          :auto-upload="false"
          :on-change="handleChange"
          :on-remove="removeFile"
          drag
          v-if="showFormVisible"
          :limit="1"
          :on-exceed="
            (e) => {
              this.$message.warning('最多上传1个文件!!!!!');
            }
          "
        >
          <div
            style="
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100%;
            "
          >
            <i slot="default" class="el-icon-plus"></i>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
          </div>
        </el-upload>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelBatchDialog">取 消</el-button>
        <el-button type="primary" @click="SendFile">发送</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from "@/utils/request";
import dayjs from "dayjs";
export default {
  name: "App",
  data() {
    return {
      content: "",
      chatList: [],
      socketURI: "",
      socket: "",
      index: 0,
      self: "",
      fileIcons: {
        doc: require("@/assets/word.png"),
        docx: require("@/assets/word.png"),
        pdf: require("@/assets/word.png"),
        xls: require("@/assets/word.png"),
        xlsx: require("@/assets/word.png"),
        ppt: require("@/assets/word.png"),
        pptx: require("@/assets/word.png"),
        zip: require("@/assets/word.png"),
      },
      //弹窗
      showFormVisible: false,
      avatar: "",
    };
  },
  mounted() {
    if (process.env.NODE_ENV == "development") {
      this.socketURI = `ws://192.168.6.24:1015/api/connection`;
    } else {
      if (window.api) {
        this.socketURI = `ws://${window.api.getIpAddress()}:1015/api/connection`;
      } else {
        this.socketURI = `ws://${window.location.host}/api/connection`;
      }
    }
    this.initSocket();
  },
  updated() {
    this.$nextTick(() => {
      this.$refs.record.scrollTop = this.$refs.record.scrollHeight;
    });
  },
  destroyed() {
    this.socket.close();
  },
  methods: {
    /**
     * Socket相关
     */
    initSocket() {
      this.socket = new WebSocket(this.socketURI);
      this.socketOnOpen();
      this.socketOnMessage();
      this.socketOnError();
      this.socketOnClose();
    },
    socketOnOpen() {
      this.socket.onopen = () => {
        console.log("连接成功");
      };
    },
    socketOnMessage() {
      this.socket.onmessage = (res) => {
        let data = JSON.parse(res.data);
        if (data.self) {
          this.self = data.self;
          this.avatar = data.avatar;
        } else {
          this.chatList.push({
            id: this.index,
            Sender: data.Sender,
            SendContent: data.SendContent,
            SendTime: this.toggleTime(data.SendTime),
            type: data.type,
            fileType: data.fileType,
            avatar: data.avatar,
          });
          this.index++;
        }
      };
    },
    socketOnClose() {
      this.socket.onclose = () => {
        console.log("close socket");
      };
    },
    socketOnError() {
      this.socket.onerror = () => {
        console.log("socket 链接失败");
      };
    },
    Send() {
      this.content = this.content.replace(/^\s+|\s+$/g, "");
      if (this.content != "") {
        this.socket.send(
          JSON.stringify({ type: "text", content: this.content })
        );
        
        this.content = "";
      }
    },
    /**
     * 弹窗
     */
    openBatchAddDialog() {
      this.showFormVisible = true;
      this.file = "";
    },
    cancelBatchDialog() {
      this.showFormVisible = false;
      this.file = "";
    },
    /**
     * 文件相关
     *
     */
    handleChange(file) {
      this.file = file.raw;
    },
    removeFile() {
      this.file = "";
    },
    SendFile() {
      if (!this.file) {
        return this.$message.warning("请选择文件后在上传");
      }
      let formData = new FormData();
      formData.append("file", this.file);
      request({
        url: "/addFile",
        data: formData,
        method: "post",
        headers: { "Content-Type": "multipart/form-data;" },
      }).then((res) => {
        if (res.code == 200) {
          let filenamePath;
          if (process.env.NODE_ENV == "development") {
            filenamePath =
              "http://192.168.6.24:1015/api/download?filename=" + res.filename;
          } else {
            if (window.api) {
              filenamePath = `http://${window.api.getIpAddress()}:1015/api/download?filename=${
                res.filename
              }`;
            } else {
              filenamePath = `http://${window.location.host}/api/download?filename=${res.filename}`;
            }
          }
          this.socket.send(
            JSON.stringify({ type: "file", content: filenamePath })
          );
          this.cancelBatchDialog();
        }
      });
    },
    //下载文件
    downloadFile(url) {
      if (window.api) {
        window.api.DownloadFile(url);
      } else {
        window.open(url, "_blank");
      }
    },
    //复制文本
    copyText(text) {
      this.$copyText(text)
        .then((e) => {
          this.$message.success("复制成功!!!");
        })
        .catch((err) => {
          this.$message.error("复制失败!!!");
        });
    },
    //获取文件图标
    getFileIcons(fileSuffix) {
      switch (fileSuffix) {
        case "docx":
        case "doc":
          return require("@/assets/word.png");
        case "xls":
        case "xlsx":
          return require("@/assets/excel.png");
        case "ppt":
        case "pptx":
          return require("@/assets/ppt.png");
        case "pdf":
          return require("@/assets/pdf.png");
        case "rar":
        case "zip":
        case "gz":
        case "tar":
        case "7z":
          return require("@/assets/zip.png");
        case "avi":
        case "mpeg":
        case "wmv":
        case "mov":
        case "flv":
        case "mp4":
          return require("@/assets/mp4.png");
        default:
          return require("@/assets/txt.png");
      }
    },
    getFileSuffix(path) {
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
    },
    //获取文件名
    getFileName(path) {
      path = path.substring(path.lastIndexOf("?") + 1);
      let params = path.split("=");
      return params[1];
    },
    getCurrent() {
      var dat = new Date();
      //获取年月日，时间
      var year = dat.getFullYear();
      var mon =
        dat.getMonth() + 1 < 10
          ? "0" + (dat.getMonth() + 1)
          : dat.getMonth() + 1;
      var data = dat.getDate() < 10 ? "0" + dat.getDate() : dat.getDate();
      var hour = dat.getHours() < 10 ? "0" + dat.getHours() : dat.getHours();
      var min =
        dat.getMinutes() < 10 ? "0" + dat.getMinutes() : dat.getMinutes();
      var seon =
        dat.getSeconds() < 10 ? "0" + dat.getSeconds() : dat.getSeconds();

      var newDate =
        year + "-" + mon + "-" + data + " " + hour + ":" + min + ":" + seon;
      return newDate;
    },
    //根据不同时间的消息，输出不同的时间格式
    toggleTime(date) {
      var time;
      var type = this.getDateDiff(date);
      //1：新消息，2：当天消息,3：昨天消息，4：今年消息，5：其他消息
      if (type == 1) {
        time = "刚刚"; //新消息，不显示时间，但是要显示"以下为最新消息"
      } else if (type == 2) {
        time = dayjs(date).format("H:mm"); //当天消息，显示：10:22
      } else if (type == 3) {
        time = dayjs(date).format("昨天 H:mm"); //昨天消息，显示：昨天 20:41
      } else if (type == 4) {
        time = dayjs(date)
          .format("M月D日 AH:mm")
          .replace("AM", "上午")
          .replace("PM", "下午"); //今年消息，上午下午，显示：3月17日 下午16:45
      } else if (type == 5) {
        time = dayjs(date)
          .format("YYYY年M月D日 AH:mm")
          .replace("AM", "上午")
          .replace("PM", "下午"); //其他消息，上午下午，显示：2020年11月2日 下午15:17
      }
      return time;
    },
    //判断消息类型
    getDateDiff(date) {
      var nowDate = dayjs(new Date()); //当前时间
      var oldDate = dayjs(new Date(date)); //参数时间
      var result;
      if (nowDate.year() - oldDate.year() >= 1) {
        result = 5;
      } else if (
        nowDate.month() - oldDate.month() >= 1 ||
        nowDate.date() - oldDate.date() >= 2
      ) {
        result = 4;
      } else if (nowDate.date() - oldDate.date() >= 1) {
        result = 3;
      } else if (
        nowDate.hour() - oldDate.hour() >= 1 ||
        nowDate.minute() - oldDate.minute() >= 5
      ) {
        result = 2;
      } else {
        result = 1;
      }
      return result;
    },
  },
};
</script>

<style scoped lang="scss">
.header {
  padding: 0 5%;
  height: 60px;
  display: flex;
  align-items: center;
  font-size: 28px;
  font-family: DancingScript, cursive;
  margin-bottom: 20px;
}
.content {
  /* margin: 10px 0; */
  padding: 10px 20px;
}
.footer {
  padding: 0 20px;
}
.item {
  margin: 10px 0;
}
.sender-info {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 10px;
}
.sender-content {
  background-color: #12b886;
  border-radius: 5px;
  padding: 10px;
  color: white;
  max-width: 45vw;
  white-space: pre-wrap;
  cursor: pointer;
}
.receiver-info {
  display: flex;
  align-items: center;
  justify-content: flex-start;

  margin-bottom: 10px;
}
.receiver-content {
  background-color: #fff;
  border-radius: 5px;
  padding: 10px;
  color: #000;
  max-width: 45vw;
  white-space: pre-wrap;
  min-width: 200px;
  cursor: pointer;
}
::v-deep .el-textarea__inner {
  min-height: 38px !important;
}
::v-deep .box-card {
  border: 0;
  background-color: transparent;
}
.story {
  height: 298px;
  overflow: auto;
  position: relative;
  &::-webkit-scrollbar {
    width: 8px;
    background-color: none;
  }
  &:hover ::-webkit-scrollbar-track-piece {
    background-color: #eee;
    opacity: 0;
    border-radius: 3px;
    transition: all 1s ease 0s;
  }

  &:hover::-webkit-scrollbar-thumb:hover {
    transition: all 1s ease 0s;
    opacity: 1;
  }
  &:hover::-webkit-scrollbar-thumb:vertical {
    line-height: 1.7;
    background-image: linear-gradient(0deg, #fbc2eb 0, #a6c1ee);
    background-blend-mode: screen, overlay, hard-light, color-burn, color-dodge,
      normal;
    background-attachment: fixed;
    background-repeat: no-repeat;
    background-position: 0 100%;
    // background-color: #eee;
    border-radius: 3px;
    outline: 2px solid #fff;
    outline-offset: -2px;
    border: 2px solid #fff;
  }
}
::v-deep .el-upload-dragger {
  width: 20em;
}
</style>


