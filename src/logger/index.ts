import * as fs from "fs";
import consoleLog from "./console.log";
import consoleError from "./console.error";

const queue: string[] = [];

// TODO: adicionar numa fila e criar um timer para ficar printando setInterval
export function createLogger(prefix: string) {
  return function log(title: string, ...data: any[]): void {
    let timestamp = "";
    if (process.env.TIMESTAMP_LOGS === "true") {
      timestamp = `${new Date().toLocaleString()} `;
    }

    queue.push(
      `${timestamp}[${prefix}] ${title} ${data
        .map((d) => JSON.stringify(d))
        .join(" ")}`,
    );

    const log = title.search("rro") === -1 ? consoleError : consoleLog;

    if (process.env.ALL_LOGS !== "true") {
      log(`${timestamp}[${prefix}] ${title}`, data);
    }
  };
}

process.on("exit", () => {
  const filename = `log-${new Date().toLocaleString().replace(" ", "-")}.txt`;
  fs.writeFileSync("log.txt", queue.join("\n"));
});
