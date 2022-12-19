import { spawn } from "child_process";

// input:
// entryPoint [{ collection: "ame", query: { _id: { $in: [{ $oid: "5a85a974dd5e15cf4ddad6b3" }] }} }]
// relations


const mongoUri =
    "mongodb://root:root@localhost:27017/sm-vend-test?ssl=false&authSource=admin";

// Collection:
//   filed: "" # default _id
//   toCollection: ""
//   toField: "" # default _id

// create relation graph
//
//
// mongodb selective export

const documentsInProcess = [];
const loadDocuments = new Set(); // collection._id

const query = { _id: { $in: [{ $oid: "5a85a974dd5e15cf4ddad6b3" }] } };
const collection = "Organization";

const ls = spawn("mongoexport", [
    `-c=${collection}`,
    `--query=${JSON.stringify(query)}`,
    `--uri=${mongoUri}`,
]);

ls.stderr.on("data", (data) => {
    console.log(`stderr: ${data}`);
});

ls.stdout.on("data", (data) => {
    const res = data
        .toString()
        .split(/\r?\n/)
        .filter((r: string) => r)
        .map((r: string) => JSON.parse(r));
    console.log(
        `stdout:`,
        res
            `\n\r \n\r`
    );
});

ls.on("close", (code) => {
    console.log(`child process close all stdio with code ${code}`);
});

ls.on("exit", (code) => {
    console.log(`child process exited with code ${code}`);
});
