let { readFileSync, createReadStream } = require("node:fs");
let { createServer: https } = require("node:https");
let { createServer: http } = require("node:http");


let { writeFile } = require("node:fs/promises");
let { exec } = require("node:child_process");

let base = "https://localhost";
let cert = "./localhost.crt";
let key = "./localhost.key";

let users = {};

let main = async (url, data, href, file) => {
    if (url.pathname == "/get") {

        let user = url.searchParams.get("user");
        let main = await users[user];
        if (!main) return data("", "text/plain");
        main.stdout.resume();
        main.stdout.once("data", text => {
            main.stdout.pause();
            data(text, "text/plain");
        });

    } else if (url.pathname == "/put") {

        let user = url.searchParams.get("user");
        let text = url.searchParams.get("text");
        let main = await users[user];
        if (main) main.stdin.write(text);
        data("", "text/plain");

    } else if (url.pathname == "/start") {

        let user = url.searchParams.get("user");
        let code = url.searchParams.get("code");

        users[user] = new Promise(async resolve => {
            await new Promise(resolve => exec(`mkdir ./exec/${user}`).on("exit", () => resolve()));
            await writeFile(`./exec/${user}/main.c`, code);
            await new Promise(resolve => exec(`gcc ./exec/${user}/main.c -o ./exec/${user}/main`).on("exit", () => resolve()));
            let main = exec(`stdbuf -o0 ./exec/${user}/main`);
            main.on("exit", () => delete users[user]);
            main.stdout.pause();
            resolve(main);
        });
        data("", "text/plain");

    } else {
        try {
            await file(url);
        } catch {
            await data("Error 404", "text/plain");
        }
    }
};


let type = pathname => pathname.endsWith(".txt") ? "text/plain" : pathname.endsWith(".html") ? "text/html" : pathname.endsWith(".css") ? "text/css" : pathname.endsWith(".js") ? "text/javascript" : pathname.endsWith(".json") ? "application/json" : pathname.endsWith(".wasm") ? "application/wasm" : pathname.endsWith(".pdf") ? "application/pdf" : pathname.endsWith(".png") ? "image/png" : pathname.endsWith(".woff") ? "font/woff" : pathname.endsWith(".woff2") ? "font/woff2" : "application/octet-stream";

let stat = url => !url.pathname.endsWith("/") ? url.pathname.includes(".") ? true : !Boolean(url.pathname += "/") : Boolean(url.pathname += "index.html");

https({ cert: readFileSync(cert), key: readFileSync(key) }, (req, res) => main(
    new URL(req.url, base),
    (data, mime) => new Promise(resolve => res.writeHead(200, {
        "Content-Type": mime
    }).end(data).on("finish", () => resolve())),
    (href, temp) => new Promise(resolve => res.writeHead(temp ? 307 : 308, {
        "Location": href
    }).end().on("finish", () => resolve())),
    url => new Promise((resolve, reject) => stat(url) ? createReadStream("app" + url.pathname).on("error", () => reject()).on("data", () => res.writeHead(200, {
        "Content-Type": type(url.pathname)
    })).pipe(res).on("finish", () => resolve()) : res.writeHead(307, {
        "Location": url.href
    }).end().on("finish", () => resolve()))
)).listen(443);

http((req, res) => res.writeHead(308, {
    "Location": base + req.url
}).end()).listen(80);
