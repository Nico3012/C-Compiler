let { exec, spawnSync, execFile } = require("node:child_process");

// exec("gcc ./run/file.c -o ./run/file");

/*let cmd = exec("./exec/nico3012/main");

cmd.stdout.on("data", data => {
    console.log(data);
    cmd.stdin.write("12\n");
});*/

let file = exec("stdbuf -o0 ./exec/main");

file

// file.stdin.write("13\n");
file.stdout.on("data", data => {
    file.stdout.pause();
    console.log(data);
    setTimeout(() => file.stdout.resume(), 5000);
});

//file.stdin.write("13\n");
//file.stdin.on("unpipe", data => console.log("pipe", data));
//file.stderr.on("data", data => console.log(data));
//file.stdout.on("data", data => console.log(data));

/*let cmd = spawn("./exec/nico3012/main");

cmd.stdin.write("13\n");
cmd.stdout.on("readable", data => {
    console.log(data)
});
*/

// stdbuf -oL ./main > main.txt // buffers one line
// stdbuf -o0 ./main > main.txt // buffers nothing
