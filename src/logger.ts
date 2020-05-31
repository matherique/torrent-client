export function createLogger(prefix: string) {
  return function log<T = string>(title: string, data?: T): void{
    const text = `[${prefix}]: ${title}`;
      
    const d = data || "";
    const s = data ? `-`: "";
    
    if (title.search("rro") === -1) {
      console.log('\x1b[32m%s\x1b[0m', text, s, d);  //cyan
    } else {
      console.log('\x1b[31m%s\x1b[0m', text, s, d);  //cyan
    }
  }
}
