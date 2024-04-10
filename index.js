import express from "express";
import multer from "multer";
import { getJson, uploadJson } from "./api.js";
import path from 'path';
import bodyParser from "body-parser";
import fs from 'fs';
import cors from 'cors';

const port = 1145;

const app = express();
const upload = multer({ dest: './temp' });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.listen(port, () => {
    console.log(`Running Port:${port}`);
});

app.use('/getPlugin', express.static('./plugin/src'));
app.use('/getList', express.static('./plugin/list.json'));

// body:tag, author, name, wiki, authorId
app.post('/newPlugin', upload.single('file'), (req, res) => {
    const file = req.file;
    req.body.tag = JSON.parse(req.body.tag);
    const { tag, name } = req.body;
    // console.log(req.body)

    // 是否未上传文件
    if (!file) {
        console.log('No file uploaded.');
        return res.status(400);
    }

    const list = getJson(path.join('./plugin', 'list.json'));
    const config = getJson(path.join('./plugin', 'config.json'));

    // 名称存在
    if (Object.keys(list).includes(name)) {
        fs.unlinkSync(file.path);
        console.log(`[${name}] Name already exists`);
        return res.status(400);
    }

    // 新增不存在的tag
    tag.forEach(element => {
        if (config.tag.system.includes(element) < 0) {
            config.tag.custom.push(element);
        }
    });


    const { authorId } = req.body;
    list[name] = {};

    const baseDir = path.join('./plugin/src/')
    const filedir = path.join('./plugin/src/' + `${authorId}`);
    const fileSavePath = path.join('./plugin/src/' + `${authorId}/${name}.json`);
    // 重命名上传文件
    if (!fs.existsSync(baseDir)) { fs.mkdirSync(baseDir); }
    if (!fs.existsSync(filedir)) { fs.mkdirSync(filedir); }

    fs.renameSync(file.path, fileSavePath);

    // author, name, wiki, authorId, tag
    Object.keys(req.body).forEach(v => {
        if (v == 'file') {
            return;
        }
        {
            list[name][v] = req.body[v];
        }
    });
    list[name].update = Date.now();
    uploadJson(path.join('./plugin', 'config.json'), config);
    uploadJson(path.join('./plugin', 'list.json'), list);
});

// {name:xxx, authorId:""}
app.get('/rmPlugin', (req, res) => {
    const list = getJson(path.join('./plugin', 'list.json'));
    const config = getJson(path.join('./plugin', 'config.json'));

    const data = req.body;
    const fileName = data.name;
    const authorId = data.authorId;

    if (Object.keys(list).includes(fileName) < 0) { return res.status(400).send('File does not exist'); }

    fs.unlink(path.join('./plugin/src' + `${authorId}/${fileName}.js`));

    list[fileName].tag.forEach(v => {
        const index = config.tag.custom.includes(v);
        if (index >= 0) {
            config.tag.custom.splice(index, 1);
        }
    });

    delete list[fileName];

    uploadJson(path.join('./plugin', 'config.json'), config);
    uploadJson(path.join('./plugin', 'list.json'), list);
})

