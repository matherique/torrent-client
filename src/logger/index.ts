import consoleError from "./console.error";
import consoleLog from "./console.log";

// TODO: adicionar numa fila e criar um timer para ficar printando setInterval
export function createLogger(prefix: string) {
  return function log(title: string, ...data: any[]): void{
    let timestamp = "";
    if (process.env.TIMESTAMP_LOGS === "true") {
      timestamp = `${new Date().toLocaleString()} `;
    }

    const text = `${timestamp}[${prefix}] ${title}`;
    const d = data || "";
    
    const log = (title.search("rro") === -1) ? consoleError : consoleLog;
    log(text, d);
  }
}
