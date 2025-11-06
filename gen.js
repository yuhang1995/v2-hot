import fetch from 'node-fetch'
import * as cheerio from 'cheerio';
import fs from 'fs'

let pathName2 = "./public/";
if (!fs.existsSync(pathName2)) {
    fs.mkdirSync(pathName2)
}

let pathName = "./public/hot/";
if (!fs.existsSync(pathName)) {
    fs.mkdirSync(pathName)
}

function getNDayList(files, n) {
    let list = []
    files.slice(0, n).map(i => {
        try {
            let l = fs.readFileSync(pathName + '/' + i + '.json')
            if (l) l = JSON.parse(l)
            l.map(v => {
                if (!list.find(a => a.id == v.id)) {
                    list.push(v)
                }
            })
        } catch (e) {
            console.error('error', e)
        }
    })

    list.sort((a, b) => {
        return b.replyCount - a.replyCount
    })
    if (n === 30) {
        list = list.filter(v => {
            return v.replyCount > 100
        })
    }
    if (n === 7) {
        list = list.filter(v => {
            return v.replyCount > 50
        })
    }
    // console.log('files', files)
    fs.writeFileSync(
        pathName + `/${n}d.json`,
        JSON.stringify(list)
    );
}

async function run() {
    let res = await fetch('https://www.v2ex.com/?tab=hot')
    let text = await res.text()
    const $ = cheerio.load(text);
    let listEl = $("div[class='cell item']");
    let list = []
    listEl.each(function () {
        let item_title = $(this).find('.topic-link')
        if (!item_title.length) return
        let item = {}
        let href = item_title[0].attribs.href
        let r = href.match(/(\d+)/)
        if (r && r[0]) {
            item.id = r[0] - 0
        }
        item.title = item_title.text()
        item.replyCount = $(this).find('.count_livid').text() - 0
        item.avatar = $(this).find('.avatar').attr('src')

        let topicInfo = $(this).find('.topic_info')
        let strongList = topicInfo.find('strong')
        item.username = $(strongList[0]).text();

        if (strongList.length > 1) {
            item.lastReplyUsername = $(strongList[1]).text();
        }

        let date = topicInfo.find('span');
        if (date.length) {
            item.lastReplyDateAgo = date.text().replace(' +08:00', '');
            item.lastReplyDate = date.attr('title').replace(' +08:00', '');
        }

        let nodeEl = topicInfo.find('.node');
        if (nodeEl.length) {
            item.nodeTitle = nodeEl.text();
            item.nodeUrl = nodeEl.attr('href').replace('/go/', '');
        }
        item.isTop = false
        let css = $(this).css()
        if (Object.keys(css).length) {
            item.isTop = true
        }
        list.push(item)
    })

    const now = new Date();
    const year = now.getFullYear(); // 获取当前年份
    const month = now.getMonth() + 1; // 获取当前月份，注意月份从 0 开始，因此需要 +1
    const day = now.getDate(); // 获取当前日期
    const h = now.getHours(); // 获取当前日期
    const m = now.getMinutes(); // 获取当前日期

    fs.writeFileSync(
        pathName + `/test-${year}-${month}-${day}-${h}-${m}.json`,
        JSON.stringify(list)
    );

    fs.writeFileSync(
        pathName + `/${year}-${month}-${day}.json`,
        JSON.stringify(list)
    );

    let files = fs.readdirSync(pathName);
    files = files.filter(v => {
        return !['map.json', '3d.json', '7d.json', '30d.json', 'new.txt'].includes(v) && !v.includes('test-');
    }).map(file => {
        file = file.replace('.json', '')
        return file
    });

    files.sort((a, b) => {
        let d1 = new Date(a)
        let d2 = new Date(b)
        return d1.valueOf() > d2.valueOf() ? -1 : 1;
    })

    getNDayList(files, 3);
    getNDayList(files, 7);
    getNDayList(files, 30);

    fs.writeFileSync(
        pathName + `/map.json`,
        JSON.stringify(files)
        // JSON.stringify(files, null, 2)
    );
    // console.log(list)
}


run()
