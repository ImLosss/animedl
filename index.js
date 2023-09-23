const puppeteer = require('puppeteer');
const axios = require('axios')
const fs = require('fs')

const animedl = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let data;
    let no;
    let input;
    let anime

    let search = await promptUser('Masukkan judul anime : ');

    // Membuat URL baru dengan parameter pencarian
    const newUrl = `https://otakudesu.wiki/?s=${encodeURIComponent(search)}&post_type=anime`;

    // Set header User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36');
    await page.setViewport({
        width: 1600,
        height: 1800
    });

    page.setDefaultTimeout(60000);

    await page.goto(newUrl);

    await page.waitForSelector('div.venser > div > div > ul')

    data = await page.evaluate(() => {
        const ulElement = document.querySelector('div.venser > div > div > ul');
        const items = ulElement.querySelectorAll('h2');
        let results = [];
        if (items.length < 1) return false;

        items.forEach((item) => {
            const link = item.querySelector('a');
            results.push({title: item.textContent, link: link.href })
        });

        return results;
    });

    if(!data) {
        await browser.close();
        return console.log('Anime tidak ditemukan')
    };

    input = "\nReply berdasarkan indeks:\n"
    no = 0;

    data.forEach((item) => {
        input += `[${ no + 1 }] ${ item.title }\n`
        no+=1;
    })

    input += "\nPilih anime : "
    // Minta input pengguna untuk indeks item yang akan diklik
    let pilAnime = await promptUser(input);

    if(isNaN(pilAnime) || pilAnime <= 0 || pilAnime > data.length) {
        await browser.close();
        return console.log('Reply sesuai dengan indeks! Coba kembali...');
    }

    // Konversi input pengguna menjadi angka (pastikan valid)
    pilAnime = parseInt(pilAnime);

    // console.log(data[pilAnime - 1].link);

    await page.goto(data[pilAnime - 1].link);

    await page.waitForSelector('#venkonten > div.venser > div:nth-child(8) > ul')

    data = await page.evaluate(() => {
        const ulElement = document.querySelector('#venkonten > div.venser > div:nth-child(8) > ul');
        const items = ulElement.querySelectorAll('span > a');
        const result = [];

        items.forEach((item) => {
            result.push({ title: item.textContent, link: item.href })
        });

        return result;
    });

    input = "\nReply berdasarkan indeks:\n"
    no = 0;

    data.forEach((item) => {
        input += `[${ no + 1 }] ${ item.title }\n`
        no+=1;
    })

    input += "\nPilih Episode : "

    // Minta input pengguna untuk indeks item yang akan diklik
    pilAnime = await promptUser(input);

    if(isNaN(pilAnime) || pilAnime <= 0 || pilAnime > data.length) {
        await browser.close();
        return console.log('Reply sesuai dengan indeks! Coba kembali...');
    }

    // Konversi input pengguna menjadi angka (pastikan valid)
    pilAnime = parseInt(pilAnime);

    // console.log(data[pilAnime - 1].link);

    anime = data[pilAnime-1].title;

    await page.goto(data[pilAnime - 1].link);

    await page.waitForSelector('#venkonten > div.venser > div.venutama > div.download > ul:nth-child(2)')
    
    data = await page.evaluate(() => {
        const ulElement = document.querySelector('#venkonten > div.venser > div.venutama > div.download > ul:nth-child(2)');
        const items = ulElement.querySelectorAll('li:nth-child(3) > a');
        let result = false;
        let link = "";

        items.forEach((item) => {
            let strLink = ['AceFile', 'aceFile', 'Acefile']
            if (strLink.some(pre => item.textContent == `${ pre }`)) {
                link += item.href;
                result = true
            } 
        });

        if (result) return link
        else return result
    });

    // console.log(data);
    console.log('\nMencari link download...\n')

    if (!data) {
        await browser.close();
        return console.log('gagal mengambil link download')
    }

    // Set header Cookie
    const cookies = [{
            name: '_ga',
            value: 'GA1.2.28378388.1668954499',
            domain: '.acefile.co',
        },
        {
            name: 'ps_sess',
            value: 'ripb1vpbe5preqvsaahjjtug690troml',
            domain: '.acefile.co',
        },
        {
            name: 'ace_csrf',
            value: 'ae3083531cf9bc8a4bcbd537c070ea35',
            domain: '.acefile.co',
        },
        {
            name: '_gid',
            value: 'GA1.2.1100072760.1694858296',
            domain: '.acefile.co',
        },
        {
            name: 'cf_clearance',
            value: 'lxQPsySjy8Dm2HJA1kuZLaSHRhuNrlH5rcaNz84wibg-1694858303-0-1-31c67109.62e3b1de.c9835428-0.2.1694858303',
            domain: '.acefile.co',
        },
        {
            name: '_gat',
            value: '1',
            domain: '.acefile.co',
        },
        {
            name: '_ga_J8KFR8K0NQ',
            value: 'GS1.2.1694858296.17.1.1694859879.0.0.0',
            domain: '.acefile.co',
        },
        // Tambahkan cookie lainnya sesuai kebutuhan
    ];

    await page.setCookie(...cookies);

    // Navigasi ke halaman web Acefile.co
    await page.goto(data);

    // Menambahkan event listener untuk mengambil URL unduhan saat unduhan dimulai
    let status = false;
    page.on('response', async (response) => {
        const url = response.url();
        if (response.request().resourceType() === 'document' && response.status() === 200) {
            // Ini adalah tanggapan untuk halaman web yang dapat Anda periksa atau lanjutkan interaksi
            status = true;
            if (url.includes('accounts.google.com') || url.includes('acefile.co')) status = 'gagal saat mencoba mengambil link download anda'
            else return console.log(`${ anime } 720p\n\nIkuti link dibawah untuk mulai mendownload:\n${ url }\n\nNote:\nLink hanya berlaku dalam beberapa menit kedepan`);
        } else if (response.request().resourceType() === 'other' && response.status() === 200) {
            // kode jika ada link yang terbuka setelah melakukan klik page
        }
    });

    await page.waitForTimeout(5000)

    await page.click("body > div.container > div > div:nth-child(17) > button")

    if (status) return await browser.close()

    await page.waitForTimeout(8000)

    await page.click('#uc-download-link')


    // Ambil screenshot halaman sebelum navigasi
    await page.screenshot({path: './screenshot_before.png'});

    await page.waitForTimeout(5000)

    // Ambil screenshot halaman sebelum navigasi
    await page.screenshot({path: './screenshot_after.png'});

    // Tutup browser
    await browser.close();
}

const download = async (url) => {
    return new Promise((resolve, reject) => {
        const path = `./vid.mp4`;
        axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        })
        .then(response => {
            response.data.pipe(fs.createWriteStream(path))
            .on('finish', () => {
                resolve(path);
            });
        })
        .catch(error => {
            reject(error);
        });
    })
}

function promptUser(question) {
    return new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

animedl()